"""openFDA drug label API client — deterministic fetch (spec §14).

The Label Analyst agent reasons over the raw label text this returns; it
doesn't fetch data itself.
"""

import httpx
from pydantic import BaseModel

OPENFDA_LABEL_ENDPOINT = "https://api.fda.gov/drug/label.json"


class LabelRecord(BaseModel):
    brandName: str | None = None
    genericName: str | None = None
    manufacturerName: str | None = None
    indicationsAndUsage: str | None = None
    warningsAndCautions: str | None = None
    adverseReactions: str | None = None
    mechanismOfAction: str | None = None
    pharmClassMoa: list[str] = []
    pharmClassEpc: list[str] = []
    effectiveTime: str | None = None


def _first(values: list) -> str | None:
    return values[0] if values else None


def fetch_label(generic_name: str, brand_name: str | None = None) -> LabelRecord | None:
    """Prefer an exact brand_name match when available — a bare generic_name search can
    match combination products (e.g. "KEYTRUDA QLEX") ahead of the base product, since
    openFDA does substring/token matching rather than exact matching by default."""
    search = (
        f'openfda.brand_name.exact:"{brand_name.upper()}"'
        if brand_name
        else f'openfda.generic_name:"{generic_name}"'
    )
    params = {"search": search, "limit": 1}
    response = httpx.get(OPENFDA_LABEL_ENDPOINT, params=params, timeout=15.0)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    data = response.json()
    results = data.get("results", [])
    if not results:
        return None

    r = results[0]
    openfda = r.get("openfda", {})

    return LabelRecord(
        brandName=_first(openfda.get("brand_name", [])),
        genericName=_first(openfda.get("generic_name", [])),
        manufacturerName=_first(openfda.get("manufacturer_name", [])),
        indicationsAndUsage=_first(r.get("indications_and_usage", [])),
        warningsAndCautions=_first(r.get("warnings_and_cautions", [])),
        adverseReactions=_first(r.get("adverse_reactions", [])),
        mechanismOfAction=_first(r.get("mechanism_of_action", [])),
        pharmClassMoa=openfda.get("pharm_class_moa", []),
        pharmClassEpc=openfda.get("pharm_class_epc", []),
        effectiveTime=r.get("effective_time"),
    )
