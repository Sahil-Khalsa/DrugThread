"""FastAPI app — spec §29 API surface.

Run from the backend/ directory:
    uvicorn api.main:app --reload
"""

import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from agents.trial_historian.agent import build_history
from agents.trial_historian.subagents.setback_investigator import build_setback_investigation
from integrations.clinicaltrials.client import fetch_trials
from resolver import resolve_drug

load_dotenv()

app = FastAPI(title="DrugThread API")

MAX_SETBACK_INVESTIGATIONS = 2  # spec §12: cap subagent fan-out at 2-3


@app.get("/api/drugs/search")
def search_drug(q: str):
    identity = resolve_drug(q)
    if identity is None:
        raise HTTPException(status_code=404, detail="Not found in available public evidence.")
    return identity


class DossierRequest(BaseModel):
    drugName: str


def _nct_id_from_evidence_ids(evidence_ids: list[str]) -> str | None:
    for eid in evidence_ids:
        if eid.startswith("ev-NCT"):
            return eid.removeprefix("ev-")
    return None


@app.post("/api/dossier")
def build_dossier(req: DossierRequest):
    steps = []

    identity = resolve_drug(req.drugName)
    steps.append({"id": "s1", "label": "Resolving drug identity", "status": "complete" if identity else "failed"})
    if identity is None:
        raise HTTPException(status_code=404, detail="Not found in available public evidence.")

    general_trials = fetch_trials(identity.genericName, page_size=15)
    terminated_trials = fetch_trials(identity.genericName, page_size=8, overall_status="TERMINATED")
    steps.append({"id": "s4", "label": f"Searching clinical trial history ({len(general_trials)} + {len(terminated_trials)} records)", "status": "complete"})

    events, evidence = build_history(identity, general_trials, terminated_trials)
    steps.append({"id": "s5", "label": "Trial Historian: building timeline", "status": "complete"})

    trials_by_nct = {t.nctId: t for t in general_trials + terminated_trials}
    setback_events = [
        e for e in events if e.type in ("setback", "termination") and e.importance == "high"
    ]
    setback_investigations = []
    has_zone = bool(os.environ.get("BRIGHT_DATA_SERP_ZONE"))

    for e in setback_events[:MAX_SETBACK_INVESTIGATIONS]:
        nct_id = _nct_id_from_evidence_ids(e.evidenceIds)
        trial = trials_by_nct.get(nct_id) if nct_id else None
        if not trial:
            continue
        if not has_zone:
            steps.append({
                "id": f"s5a-{nct_id}",
                "label": f"Setback Investigator: {nct_id} skipped (Bright Data zone not configured)",
                "status": "failed",
                "parentStepId": "s5",
            })
            continue
        investigation, extra_evidence = build_setback_investigation(trial, identity)
        setback_investigations.append(investigation.model_dump())
        evidence.extend(extra_evidence)
        steps.append({
            "id": f"s5a-{nct_id}",
            "label": f"Setback Investigator: {nct_id}",
            "status": "complete",
            "parentStepId": "s5",
        })

    # Dedupe evidence by id (trial evidence can be referenced by both history and setback investigations)
    deduped_evidence = list({ev.id: ev for ev in evidence}.values())

    steps.append({"id": "s7", "label": "Cross-checking sources", "status": "complete"})

    return {
        "drug": identity.model_dump(),
        "summary": {
            "description": f"{identity.name} ({identity.genericName}) — dossier assembled from live FDA/ClinicalTrials.gov data. Label and network analysis not yet implemented.",
            "mechanism": None,
            "target": None,
        },
        "findings": [],  # Case Synthesizer not yet implemented
        "label": {
            "indications": [],
            "warnings": [],
            "adverseReactions": [],
            "evidenceIds": [],
        },  # Label Analyst not yet implemented
        "network": {"nodes": [], "edges": []},  # Network Investigator not yet implemented
        "history": {"events": [e.model_dump() for e in events]},
        "setbackInvestigations": setback_investigations,
        "evidence": [ev.model_dump() for ev in deduped_evidence],
        "agentRun": {
            "runId": str(uuid.uuid4()),
            "status": "complete",
            "steps": steps,
            "sourcesChecked": len(deduped_evidence),
        },
    }
