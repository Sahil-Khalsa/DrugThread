"""openFDA pharmacologic-class search — deterministic lookup used by the
Network Investigator's subagents (spec §14: fetching is deterministic,
selection/classification is the LLM's job).
"""

import httpx
from pydantic import BaseModel

OPENFDA_LABEL_ENDPOINT = "https://api.fda.gov/drug/label.json"


class ClassCandidate(BaseModel):
    brandName: str
    genericName: str
    manufacturerName: str | None = None
    pharmClassMoa: list[str] = []
    pharmClassEpc: list[str] = []


def search_by_pharm_class(
    field: str, value: str, limit: int = 10, exact: bool = True
) -> list[ClassCandidate]:
    """field must be 'pharm_class_moa' or 'pharm_class_epc'.

    exact=True requires the full bracketed openFDA class string (e.g.
    "CTLA-4-directed Blocking Antibody [EPC]") and is reliable when you
    already know that string. exact=False does token/partial matching, which
    is far more forgiving when guessing at a short keyword (e.g. "CTLA-4").
    """
    field_query = f"openfda.{field}.exact" if exact else f"openfda.{field}"
    params = {"search": f'{field_query}:"{value}"', "limit": limit}
    response = httpx.get(OPENFDA_LABEL_ENDPOINT, params=params, timeout=15.0)
    if response.status_code == 404:
        return []
    response.raise_for_status()
    results = response.json().get("results", [])
    candidates = []
    for r in results:
        o = r.get("openfda", {})
        brand = o.get("brand_name", [])
        generic = o.get("generic_name", [])
        if not brand or not generic:
            continue
        candidates.append(
            ClassCandidate(
                brandName=brand[0],
                genericName=generic[0],
                manufacturerName=(o.get("manufacturer_name") or [None])[0],
                pharmClassMoa=o.get("pharm_class_moa", []),
                pharmClassEpc=o.get("pharm_class_epc", []),
            )
        )
    return candidates


def search_by_indication_text(term: str, limit: int = 10) -> list[ClassCandidate]:
    params = {"search": f'indications_and_usage:"{term}"', "limit": limit}
    response = httpx.get(OPENFDA_LABEL_ENDPOINT, params=params, timeout=15.0)
    if response.status_code == 404:
        return []
    response.raise_for_status()
    results = response.json().get("results", [])
    candidates = []
    for r in results:
        o = r.get("openfda", {})
        brand = o.get("brand_name", [])
        generic = o.get("generic_name", [])
        if not brand or not generic:
            continue
        candidates.append(
            ClassCandidate(
                brandName=brand[0],
                genericName=generic[0],
                manufacturerName=(o.get("manufacturer_name") or [None])[0],
                pharmClassMoa=o.get("pharm_class_moa", []),
                pharmClassEpc=o.get("pharm_class_epc", []),
            )
        )
    return candidates
