"""Case Synthesizer agent (spec §13, Agent 4).

Flat, merge-only — no subagents, no tools, no new evidence gathering (spec
§12). Takes what Label Analyst, Network Investigator, and Trial Historian
already produced and synthesizes a short dossier summary plus 3-4 Agent
Findings, citing only evidence that was already gathered.
"""

import os

from strands import Agent
from strands.models.openai import OpenAIModel

from agents.label_analyst.agent import LabelResult
from evidence.validator import filter_grounded
from models import CaseSynthesis, HistoryEvent, NetworkEdge, NetworkNode
from resolver import DrugIdentity

SYSTEM_PROMPT = """You are the Case Synthesizer for DrugThread. You are given a drug's already- \
gathered Label, Network, and History data. Your job is to write a short overview and identify \
the most interesting cross-sectional findings — you do NOT gather new evidence or invent facts \
beyond what's already in the data given to you.

Rules:
- `summary.description` must be 2-3 plain-language sentences describing the drug, drawing only \
  on the label/network/history data provided.
- Produce 3-4 Findings maximum, each answering "what's the most interesting thing someone should \
  know about this drug?" — good findings connect across sections (e.g. a setback in the history \
  data plus a related warning in the label data), not just restate one section verbatim.
- Every finding's `evidenceIds` must be chosen ONLY from the evidence ids listed for you below. \
  Never invent one, and never leave the list empty.
- `targetTab` must be "label", "network", or "history" — whichever section the finding is most \
  about, so the frontend can link the user there.
- `confidence` must reflect the weakest evidence tier actually cited — if any cited evidence is \
  "context"-only, the finding's confidence cannot be "primary".
- Do not claim you know why a trial failed beyond what the history data already states.
"""


def build_case_synthesis(
    identity: DrugIdentity,
    label: LabelResult | None,
    network_nodes: list[NetworkNode],
    network_edges: list[NetworkEdge],
    history_events: list[HistoryEvent],
    known_evidence_ids: set[str],
) -> CaseSynthesis:
    model = OpenAIModel(
        client_args={"api_key": os.environ["OPENAI_API_KEY"]},
        model_id="gpt-4o",
        params={"temperature": 0.3},
    )
    agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)

    label_block = (
        f"Mechanism: {label.mechanism}\nTarget: {label.target}\n"
        f"Indications: {label.indications}\nWarnings: {label.majorWarnings}\n"
        f"evidenceIds available: {label.evidenceIds}"
        if label
        else "No label data available."
    )

    network_block = "\n".join(
        f"- {n.name} ({n.target or n.mechanism}) via edge from "
        f"{[e.relationship for e in network_edges if e.target == n.id]} | "
        f"evidenceIds: {n.evidenceIds}"
        for n in network_nodes
    ) or "No network data available."

    history_block = "\n".join(
        f"- [{e.year}] {e.title} ({e.type}, {e.importance}): {e.summary} | evidenceIds: {e.evidenceIds}"
        for e in history_events
    ) or "No history data available."

    prompt = (
        f"Drug: {identity.name} ({identity.genericName}), manufacturer {identity.manufacturer}\n\n"
        f"LABEL DATA:\n{label_block}\n\n"
        f"NETWORK DATA:\n{network_block}\n\n"
        f"HISTORY DATA:\n{history_block}\n\n"
        f"All evidence ids you may cite: {sorted(known_evidence_ids)}\n\n"
        "Synthesize the case now."
    )

    result = agent.structured_output(CaseSynthesis, prompt)
    result.findings = filter_grounded(result.findings, known_evidence_ids)
    return result
