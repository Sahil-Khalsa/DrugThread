"""Shared evidence-required validator (spec §30).

A type requiring `evidenceIds: list[str]` doesn't stop a model from emitting
an empty list, or citing an id that was never actually provided to it. Every
agent that produces evidence-bearing objects (HistoryEvent, Finding, label
claims, NetworkNode) must run its output through this before it reaches the
frontend.
"""

from typing import Protocol, TypeVar


class HasEvidenceIds(Protocol):
    evidenceIds: list[str]


T = TypeVar("T", bound=HasEvidenceIds)


def filter_grounded(items: list[T], known_evidence_ids: set[str]) -> list[T]:
    """Drop items with no evidenceIds, and strip any evidenceId not in the known set.

    Items left with zero valid evidenceIds after stripping are dropped entirely —
    an ungrounded claim should not reach the frontend at all, per spec §30.
    """
    result: list[T] = []
    for item in items:
        grounded = [eid for eid in item.evidenceIds if eid in known_evidence_ids]
        if not grounded:
            continue
        item.evidenceIds = grounded
        result.append(item)
    return result
