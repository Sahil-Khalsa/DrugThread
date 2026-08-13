"""Setback Investigator subagent (spec §11-13).

Spawned once per identified failed/terminated trial, capped at 2-3 per drug
(spec §12). Investigates public reporting beyond the bare ClinicalTrials.gov
`whyStopped` field — what happened next, not just why it stopped.
"""

import os

from strands import Agent, tool
from strands.models.openai import OpenAIModel

from integrations.brightdata.client import search_web
from integrations.clinicaltrials.client import TrialRecord
from models import Evidence, SetbackInvestigation
from resolver import DrugIdentity

SYSTEM_PROMPT = """You are the Setback Investigator for DrugThread. You investigate exactly one \
terminated or failed clinical trial and explain, using only public evidence, what was tested, \
what happened, and what happened next in the drug's development.

Rules you must follow exactly:
- You are given the trial's own ClinicalTrials.gov `whyStopped` field as a starting point. Use \
  the search_public_reporting tool to look for additional public reporting (sponsor releases, \
  publications, conference reports) about what happened *after* the trial stopped — did the \
  program continue elsewhere, was the indication abandoned, was a new subgroup pursued?
- Never claim "AI determined why the trial failed." Phrase the reason as "Publicly reported \
  reason: ..." or "Available public evidence indicates...".
- If ClinicalTrials.gov gives no `whyStopped` value and your search turns up nothing credible, \
  `publicExplanation` must be exactly: "No reliable public explanation found."
- If you cannot find credible evidence of what happened next, `whatHappenedNext` must say so \
  plainly rather than guessing (e.g. "No public follow-up reporting found.").
- `evidenceIds` must only contain ids that were actually given to you (the trial's own evidence \
  id, or ids returned inline by the search tool as [ev-web-...]). Never invent one.
"""


def build_setback_investigation(
    trial: TrialRecord, drug_identity: DrugIdentity
) -> tuple[SetbackInvestigation, list[Evidence]]:
    trial_evidence_id = f"ev-{trial.nctId}"
    collected_evidence: list[Evidence] = [
        Evidence(
            id=trial_evidence_id,
            sourceType="clinicaltrials",
            title=trial.briefTitle,
            publisher="ClinicalTrials.gov",
            url=f"https://clinicaltrials.gov/study/{trial.nctId}",
            excerpt=trial.whyStopped,
            authority="primary",
        )
    ]

    @tool
    def search_public_reporting(query: str) -> str:
        """Search the public web for sponsor releases, publications, or conference reports."""
        results = search_web(query, num_results=5)
        if not results:
            return "No search results found."
        lines = []
        for i, r in enumerate(results, start=1):
            eid = f"ev-web-{trial.nctId}-{i}"
            collected_evidence.append(
                Evidence(
                    id=eid,
                    sourceType="web",
                    title=r.title,
                    url=r.link,
                    excerpt=r.description,
                    authority="context",
                )
            )
            lines.append(f"[{eid}] {r.title} — {r.description} ({r.link})")
        return "\n".join(lines)

    model = OpenAIModel(
        client_args={"api_key": os.environ["OPENAI_API_KEY"]},
        model_id="gpt-4o",
        params={"temperature": 0.2},
    )
    agent = Agent(model=model, system_prompt=SYSTEM_PROMPT, tools=[search_public_reporting])

    prompt = (
        f"Drug: {drug_identity.name} ({drug_identity.genericName})\n"
        f"Trial: {trial.nctId} — {trial.briefTitle}\n"
        f"Phase: {trial.phase}\n"
        f"Status: {trial.overallStatus}\n"
        f"Trial evidence id: {trial_evidence_id}\n"
        f"ClinicalTrials.gov whyStopped field: {trial.whyStopped!r}\n\n"
        "Investigate this setback now. Search for what happened next if the whyStopped field "
        "alone doesn't tell you."
    )

    agent(prompt)
    result = agent.structured_output(SetbackInvestigation)

    known_ids = {e.id for e in collected_evidence}
    cited = [eid for eid in result.evidenceIds if eid in known_ids]
    result.evidenceIds = cited or [trial_evidence_id]

    return result, collected_evidence
