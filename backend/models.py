"""Shared structured types matching the DrugDossier contract (spec §18-19).

Pydantic models here are the source of truth agents bind their structured
output to — never free text.
"""

from typing import Literal

from pydantic import BaseModel


class Evidence(BaseModel):
    id: str
    sourceType: Literal["fda", "clinicaltrials", "publication", "sponsor", "conference", "web"]
    title: str
    publisher: str | None = None
    url: str
    date: str | None = None
    excerpt: str | None = None
    retrievedAt: str | None = None
    authority: Literal["primary", "secondary", "context"]


class HistoryEvent(BaseModel):
    id: str
    date: str | None = None
    year: int
    title: str
    type: Literal[
        "trial_started",
        "trial_result",
        "approval",
        "setback",
        "termination",
        "indication_expansion",
        "strategy_change",
        "other",
    ]
    summary: str
    phase: str | None = None
    trialId: str | None = None
    indication: str | None = None
    status: str | None = None
    evidenceIds: list[str]
    confidence: Literal["primary", "secondary", "context"]
    importance: Literal["low", "medium", "high"]


class HistoryEventList(BaseModel):
    """Wrapper so Strands' structured_output has a single root model to target."""

    events: list[HistoryEvent]


class SetbackInvestigation(BaseModel):
    """Spec §11: Failed / Terminated Trial Investigation output shape."""

    trialId: str
    whatWasTested: str
    whatHappened: str
    publicExplanation: str
    whatHappenedNext: str
    evidenceIds: list[str]
    confidence: Literal["primary", "secondary", "context"]


class NetworkNode(BaseModel):
    id: str
    name: str
    brandName: str | None = None
    genericName: str | None = None
    target: str | None = None
    mechanism: str | None = None
    status: str | None = None
    sharedIndications: list[str] = []
    evidenceIds: list[str]


class NetworkNodeList(BaseModel):
    """Wrapper so Strands' structured_output has a single root model to target."""

    nodes: list[NetworkNode]


class NetworkEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: Literal["same_target", "same_mechanism", "shared_indication"]


class Finding(BaseModel):
    id: str
    title: str
    category: Literal["development", "network", "label", "regulatory"]
    severity: Literal["info", "medium", "high"] | None = None
    summary: str
    evidenceIds: list[str]
    confidence: Literal["primary", "secondary", "context"]
    reviewStatus: Literal["unreviewed", "confirmed", "flagged"] = "unreviewed"
    targetTab: Literal["label", "network", "history"]


class DossierSummary(BaseModel):
    description: str
    mechanism: str | None = None
    target: str | None = None


class CaseSynthesis(BaseModel):
    """Case Synthesizer output (spec §13, Agent 4) — merge-only, no new evidence."""

    summary: DossierSummary
    findings: list[Finding]
