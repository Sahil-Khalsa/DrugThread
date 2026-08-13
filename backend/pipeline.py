"""The DrugThread investigation pipeline as a step-yielding generator.

Both the synchronous POST /api/dossier and the streamed
GET /api/dossier/:runId/events endpoints drive this same generator so the
orchestration logic exists in exactly one place. Orchestration itself is
plain deterministic Python (spec §14) — it fans out to agents and merges
their output; it is not itself an LLM call.
"""

import os
import uuid
from typing import Iterator

from agents.case_synthesizer.agent import build_case_synthesis
from agents.label_analyst.agent import build_label
from agents.network_investigator.agent import build_network
from agents.trial_historian.agent import build_history
from agents.trial_historian.subagents.setback_investigator import build_setback_investigation
from integrations.clinicaltrials.client import fetch_trials
from integrations.fda.client import fetch_label
from resolver import resolve_drug

MAX_SETBACK_INVESTIGATIONS = 2  # spec §12: cap subagent fan-out at 2-3


def _nct_id_from_evidence_ids(evidence_ids: list[str]) -> str | None:
    for eid in evidence_ids:
        if eid.startswith("ev-NCT"):
            return eid.removeprefix("ev-")
    return None


def run_dossier_pipeline(drug_name: str) -> Iterator[tuple[str, dict]]:
    """Yields ("step", step_dict) as progress happens, then exactly one
    ("result", dossier_dict) or ("error", {"detail": ...}) at the end."""

    identity = resolve_drug(drug_name)
    yield "step", {"id": "s1", "label": "Resolving drug identity", "status": "complete" if identity else "failed"}
    if identity is None:
        yield "error", {"detail": "Not found in available public evidence."}
        return

    label_record = fetch_label(identity.genericName, brand_name=identity.brandName)
    yield "step", {"id": "s2", "label": "Retrieving FDA label", "status": "complete" if label_record else "failed"}
    label_result, label_evidence = build_label(identity, label_record)
    yield "step", {"id": "s3", "label": "Label Analyst: extracting label fields", "status": "complete" if label_result else "failed"}

    general_trials = fetch_trials(identity.genericName, page_size=15)
    terminated_trials = fetch_trials(identity.genericName, page_size=8, overall_status="TERMINATED")
    yield "step", {"id": "s4", "label": f"Searching clinical trial history ({len(general_trials)} + {len(terminated_trials)} records)", "status": "complete"}

    events, history_evidence = build_history(identity, general_trials, terminated_trials)
    yield "step", {"id": "s5", "label": "Trial Historian: building timeline", "status": "complete"}

    trials_by_nct = {t.nctId: t for t in general_trials + terminated_trials}
    setback_events = [e for e in events if e.type in ("setback", "termination") and e.importance == "high"]
    setback_investigations = []
    setback_evidence = []
    has_zone = bool(os.environ.get("BRIGHT_DATA_SERP_ZONE"))

    for e in setback_events[:MAX_SETBACK_INVESTIGATIONS]:
        nct_id = _nct_id_from_evidence_ids(e.evidenceIds)
        trial = trials_by_nct.get(nct_id) if nct_id else None
        if not trial:
            continue
        if not has_zone:
            yield "step", {
                "id": f"s5a-{nct_id}",
                "label": f"Setback Investigator: {nct_id} skipped (Bright Data zone not configured)",
                "status": "failed",
                "parentStepId": "s5",
            }
            continue
        investigation, extra_evidence = build_setback_investigation(trial, identity)
        setback_investigations.append(investigation.model_dump())
        setback_evidence.extend(extra_evidence)
        yield "step", {
            "id": f"s5a-{nct_id}",
            "label": f"Setback Investigator: {nct_id}",
            "status": "complete",
            "parentStepId": "s5",
        }

    network_nodes, network_edges, network_evidence = build_network(
        identity,
        label_record,
        label_result.target if label_result else None,
        label_result.mechanism if label_result else None,
        label_result.indications if label_result else [],
    )
    yield "step", {"id": "s6", "label": f"Mapping mechanism neighbors ({len(network_nodes)} found)", "status": "complete"}
    for n in network_nodes:
        yield "step", {"id": f"s6-{n.id}", "label": f"Network subagent: {n.name}", "status": "complete", "parentStepId": "s6"}

    all_evidence = label_evidence + history_evidence + setback_evidence + network_evidence
    deduped_evidence = list({ev.id: ev for ev in all_evidence}.values())
    known_evidence_ids = {ev.id for ev in deduped_evidence}
    yield "step", {"id": "s7", "label": "Cross-checking sources", "status": "complete"}

    synthesis = build_case_synthesis(
        identity, label_result, network_nodes, network_edges, events, known_evidence_ids
    )
    yield "step", {"id": "s8", "label": f"Synthesizing case findings ({len(synthesis.findings)} findings)", "status": "complete"}

    yield "result", {
        "drug": identity.model_dump(),
        "summary": synthesis.summary.model_dump(),
        "findings": [f.model_dump() for f in synthesis.findings],
        "label": {
            "indications": label_result.indications if label_result else [],
            "mechanism": label_result.mechanism if label_result else None,
            "target": label_result.target if label_result else None,
            "warnings": label_result.majorWarnings if label_result else [],
            "adverseReactions": label_result.commonAdverseReactions if label_result else [],
            "evidenceIds": label_result.evidenceIds if label_result else [],
        },
        "network": {
            "nodes": [n.model_dump() for n in network_nodes],
            "edges": [e.model_dump() for e in network_edges],
        },
        "history": {"events": [e.model_dump() for e in events]},
        "setbackInvestigations": setback_investigations,
        "evidence": [ev.model_dump() for ev in deduped_evidence],
    }


def new_run_id() -> str:
    return str(uuid.uuid4())
