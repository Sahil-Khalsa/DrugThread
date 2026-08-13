"""Shared plumbing for the three Network Investigator subagents (spec §12).

Each subagent gets a deterministic openFDA search tool bound to it; the LLM's
job is choosing what to search for and which real, verified results are
actually meaningful — never inventing a drug that didn't come back from the
tool.
"""

import os

from strands import Agent, tool
from strands.models.openai import OpenAIModel

from integrations.fda.class_search import (
    ClassCandidate,
    search_by_indication_text,
    search_by_pharm_class,
)
from models import Evidence, NetworkNode, NetworkNodeList


def _candidate_evidence(candidate: ClassCandidate) -> Evidence:
    return Evidence(
        id=f"ev-fda-{candidate.brandName.upper().replace(' ', '-')}",
        sourceType="fda",
        title=f"{candidate.brandName} FDA Label",
        publisher="U.S. FDA / openFDA",
        url=f'https://api.fda.gov/drug/label.json?search=openfda.brand_name.exact:"{candidate.brandName.upper()}"',
        authority="primary",
    )


def run_subagent(
    system_prompt: str,
    prompt: str,
    origin_brand: str,
    tool_mode: str,  # "exact_class" | "partial_class" | "indication"
) -> tuple[list[NetworkNode], list[Evidence]]:
    collected_evidence: dict[str, Evidence] = {}
    known_candidates: dict[str, ClassCandidate] = {}

    def _record(candidates: list[ClassCandidate]) -> str:
        if not candidates:
            return "No results found."
        lines = []
        for c in candidates:
            if c.brandName.upper() == origin_brand.upper():
                continue  # never let the drug be its own neighbor
            ev = _candidate_evidence(c)
            collected_evidence[ev.id] = ev
            known_candidates[c.brandName.upper()] = c
            lines.append(
                f"- evidence_id={ev.id} | brandName={c.brandName} | "
                f"genericName={c.genericName} | manufacturer={c.manufacturerName} | "
                f"pharmClassMoa={c.pharmClassMoa} | pharmClassEpc={c.pharmClassEpc}"
            )
        return "\n".join(lines) if lines else "No results found (only the origin drug matched)."

    if tool_mode == "exact_class":

        @tool
        def search_pharm_class(field: str, value: str) -> str:
            """Search openFDA for drugs sharing the EXACT full pharmacologic class string
            (e.g. "Programmed Death Receptor-1-directed Antibody Interactions [MoA]"). field
            must be 'pharm_class_moa' or 'pharm_class_epc'. Only use this when you already
            know the precise class string, e.g. because it was given to you directly."""
            return _record(search_by_pharm_class(field, value, exact=True))

        tools = [search_pharm_class]
    elif tool_mode == "partial_class":

        @tool
        def search_pharm_class_keyword(field: str, keyword: str) -> str:
            """Search openFDA for drugs whose pharmacologic class mentions this short
            keyword (e.g. "CTLA-4", "LAG-3", "TIGIT"). Use a short keyword, NOT a full
            guessed class string — this does partial/token matching, so short and specific
            beats long and precise here. field must be 'pharm_class_moa' or
            'pharm_class_epc'."""
            return _record(search_by_pharm_class(field, keyword, exact=False))

        tools = [search_pharm_class_keyword]
    else:

        @tool
        def search_indication(term: str) -> str:
            """Search openFDA for other drugs whose label mentions this indication term."""
            return _record(search_by_indication_text(term))

        tools = [search_indication]

    model = OpenAIModel(
        client_args={"api_key": os.environ["OPENAI_API_KEY"]},
        model_id="gpt-4o",
        params={"temperature": 0.2},
    )
    agent = Agent(model=model, system_prompt=system_prompt, tools=tools)
    agent(prompt)
    result = agent.structured_output(NetworkNodeList)

    known_evidence_ids = set(collected_evidence.keys())
    valid_nodes = []
    for n in result.nodes:
        cited = [eid for eid in n.evidenceIds if eid in known_evidence_ids]
        if not cited:
            continue
        n.evidenceIds = cited
        valid_nodes.append(n)

    return valid_nodes, list(collected_evidence.values())
