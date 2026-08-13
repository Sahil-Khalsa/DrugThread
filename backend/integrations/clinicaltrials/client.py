"""ClinicalTrials.gov v2 API client — deterministic fetch + normalization.

Spec §14: prefer deterministic code for fetching/parsing over LLM reasoning.
The Trial Historian agent reasons over what this returns; it doesn't fetch
data itself.
"""

import httpx
from pydantic import BaseModel

CTGOV_BASE = "https://clinicaltrials.gov/api/v2/studies"

_FIELDS = ",".join(
    [
        "NCTId",
        "BriefTitle",
        "OverallStatus",
        "Phase",
        "WhyStopped",
        "StartDate",
        "PrimaryCompletionDate",
        "CompletionDate",
    ]
)


class TrialRecord(BaseModel):
    nctId: str
    briefTitle: str
    phase: str | None = None
    overallStatus: str | None = None
    whyStopped: str | None = None
    startDate: str | None = None
    primaryCompletionDate: str | None = None
    completionDate: str | None = None


def _parse_study(study: dict) -> TrialRecord:
    protocol = study.get("protocolSection", {})
    ident = protocol.get("identificationModule", {})
    status = protocol.get("statusModule", {})
    design = protocol.get("designModule", {})
    phases = design.get("phases") or []
    return TrialRecord(
        nctId=ident.get("nctId", ""),
        briefTitle=ident.get("briefTitle", ""),
        phase=phases[0] if phases else None,
        overallStatus=status.get("overallStatus"),
        whyStopped=status.get("whyStopped"),
        startDate=status.get("startDateStruct", {}).get("date"),
        primaryCompletionDate=status.get("primaryCompletionDateStruct", {}).get("date"),
        completionDate=status.get("completionDateStruct", {}).get("date"),
    )


def fetch_trials(
    drug_term: str, page_size: int = 50, overall_status: str | None = None
) -> list[TrialRecord]:
    """Fetch trials mentioning drug_term. Pass overall_status (e.g. "TERMINATED") to filter."""
    params = {
        "query.term": drug_term,
        "pageSize": page_size,
        "fields": _FIELDS,
    }
    if overall_status:
        params["filter.overallStatus"] = overall_status

    response = httpx.get(CTGOV_BASE, params=params, timeout=10.0)
    response.raise_for_status()
    data = response.json()
    return [_parse_study(s) for s in data.get("studies", [])]


def fetch_trial_count(drug_term: str, overall_status: str | None = None) -> int:
    params = {"query.term": drug_term, "pageSize": 1, "countTotal": "true"}
    if overall_status:
        params["filter.overallStatus"] = overall_status
    response = httpx.get(CTGOV_BASE, params=params, timeout=10.0)
    response.raise_for_status()
    return response.json().get("totalCount", 0)
