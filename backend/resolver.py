"""Deterministic drug name -> identity resolution.

Spec §14: prefer deterministic transformations over LLM reasoning for
normalization work like this. No model call needed to know "Keytruda"
means pembrolizumab.
"""

from pydantic import BaseModel


class DrugIdentity(BaseModel):
    id: str
    name: str
    genericName: str | None = None
    brandName: str | None = None
    manufacturer: str | None = None
    status: str | None = None


_KNOWN_DRUGS: list[DrugIdentity] = [
    DrugIdentity(
        id="pembrolizumab",
        name="Keytruda",
        genericName="Pembrolizumab",
        brandName="Keytruda",
        manufacturer="Merck",
        status="Approved",
    ),
    DrugIdentity(
        id="semaglutide",
        name="Ozempic",
        genericName="Semaglutide",
        brandName="Ozempic",
        manufacturer="Novo Nordisk",
        status="Approved",
    ),
    DrugIdentity(
        id="adalimumab",
        name="Humira",
        genericName="Adalimumab",
        brandName="Humira",
        manufacturer="AbbVie",
        status="Approved",
    ),
]

_ALIASES: dict[str, str] = {
    "keytruda": "pembrolizumab",
    "pembrolizumab": "pembrolizumab",
    "ozempic": "semaglutide",
    "wegovy": "semaglutide",
    "semaglutide": "semaglutide",
    "humira": "adalimumab",
    "adalimumab": "adalimumab",
}

_BY_ID: dict[str, DrugIdentity] = {d.id: d for d in _KNOWN_DRUGS}


def resolve_drug(query: str) -> DrugIdentity | None:
    normalized = query.strip().lower()
    drug_id = _ALIASES.get(normalized)
    if drug_id is None:
        return None
    return _BY_ID[drug_id]
