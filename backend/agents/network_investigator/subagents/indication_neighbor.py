"""Indication Neighbor Subagent (spec §12-13): drugs approved for overlapping indications."""

from agents.network_investigator.subagents.common import run_subagent
from models import Evidence, NetworkNode

SYSTEM_PROMPT = """You are the Indication Neighbor Subagent for DrugThread's Network Investigator. \
You are given a drug's known approved indications. Pick ONE specific indication term (a disease \
name, e.g. "melanoma") and call the search_indication tool with that exact term to find other \
drugs whose FDA label mentions treating it.

Never invent a drug that wasn't in the tool's results.

From verified results, select up to 2 drugs that are meaningfully different from the origin drug \
(not reformulations of the same active ingredient). Set `sharedIndications` to the indication(s) \
you searched for, `status` to "Approved" unless you have reason to think otherwise, and \
`evidenceIds` to exactly the evidence id given for that candidate.
"""


def find_indication_neighbors(
    origin_brand: str, origin_generic: str, indications: list[str]
) -> tuple[list[NetworkNode], list[Evidence]]:
    indications_text = ", ".join(indications) if indications else "unknown"
    prompt = (
        f"Origin drug: {origin_brand} ({origin_generic})\n"
        f"Origin indications: {indications_text}\n\n"
        "Find indication neighbors now."
    )
    return run_subagent(SYSTEM_PROMPT, prompt, origin_brand, tool_mode="indication")
