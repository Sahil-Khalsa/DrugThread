"""Trial Historian agent (spec §13, Agent 3).

Turns raw ClinicalTrials.gov records into a small, chronological set of
structured HistoryEvents. Fetching/evidence-building is deterministic
(spec §14); only event selection, importance classification, and narrative
summarization go through the LLM.
"""

import os

from strands import Agent
from strands.models.openai import OpenAIModel

from evidence.validator import filter_grounded
from integrations.clinicaltrials.client import TrialRecord
from models import Evidence, HistoryEvent, HistoryEventList
from resolver import DrugIdentity

SYSTEM_PROMPT = """You are the Trial Historian for DrugThread, a pharmaceutical intelligence \
platform. You are given a drug's identity and a set of ClinicalTrials.gov trial records. \
Your job is to select the small number of trials that actually matter and turn them into a \
chronological history of the drug's clinical development.

Rules you must follow exactly:
- Identify major trials, approvals-implying results, setbacks, and terminations. Ignore noisy \
  or minor trials with no real significance.
- Every event's `evidenceIds` must be chosen ONLY from the evidence id list provided to you. \
  Never invent an evidence id. Never leave `evidenceIds` empty for an event derived from a \
  specific trial.
- Never claim you know *why* a trial failed beyond what the trial record's `whyStopped` field \
  says. If `whyStopped` is present, summarize it as "Publicly reported reason: ...". If a \
  terminated trial has no `whyStopped` value, say "No reliable public explanation found" \
  instead of guessing.
- Do not assert an FDA approval happened unless the provided data actually supports it — a \
  completed pivotal trial is not the same as a confirmed approval. When in doubt, classify the \
  event as `trial_result` rather than `approval`.
- Set `confidence` to "primary" for anything sourced directly from a ClinicalTrials.gov record.
- Produce at most 8 events, ordered to tell a coherent development story, not a dump of every \
  trial you were given.
"""


def _drug_search_term(identity: DrugIdentity) -> str:
    return identity.genericName or identity.name


def _build_evidence(trials: list[TrialRecord]) -> list[Evidence]:
    evidence: list[Evidence] = []
    seen: set[str] = set()
    for t in trials:
        if not t.nctId or t.nctId in seen:
            continue
        seen.add(t.nctId)
        evidence.append(
            Evidence(
                id=f"ev-{t.nctId}",
                sourceType="clinicaltrials",
                title=t.briefTitle,
                publisher="ClinicalTrials.gov",
                url=f"https://clinicaltrials.gov/study/{t.nctId}",
                excerpt=t.whyStopped,
                authority="primary",
            )
        )
    return evidence


def _trial_summary_block(trials: list[TrialRecord]) -> str:
    lines = []
    for t in trials:
        lines.append(
            f"- evidence_id=ev-{t.nctId} | nctId={t.nctId} | phase={t.phase} | "
            f"status={t.overallStatus} | start={t.startDate} | "
            f"primaryCompletion={t.primaryCompletionDate} | "
            f"whyStopped={t.whyStopped!r} | title={t.briefTitle}"
        )
    return "\n".join(lines)


def build_history(
    identity: DrugIdentity,
    general_trials: list[TrialRecord],
    terminated_trials: list[TrialRecord],
) -> tuple[list[HistoryEvent], list[Evidence]]:
    all_trials = general_trials + terminated_trials
    evidence = _build_evidence(all_trials)
    known_evidence_ids = {e.id for e in evidence}

    model = OpenAIModel(
        client_args={"api_key": os.environ["OPENAI_API_KEY"]},
        model_id="gpt-4o",
        params={"temperature": 0.2},
    )
    agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)

    prompt = (
        f"Drug: {identity.name} (generic: {identity.genericName}, manufacturer: "
        f"{identity.manufacturer})\n\n"
        f"General trial sample ({len(general_trials)} records):\n"
        f"{_trial_summary_block(general_trials)}\n\n"
        f"Terminated trial sample ({len(terminated_trials)} records):\n"
        f"{_trial_summary_block(terminated_trials)}\n\n"
        "Build the chronological HistoryEvent list now."
    )

    result = agent.structured_output(HistoryEventList, prompt)
    validated = filter_grounded(result.events, known_evidence_ids)
    return validated, evidence
