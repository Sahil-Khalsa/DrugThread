"""Target Neighbor Subagent (spec §12-13): drugs sharing the same biological target."""

from agents.network_investigator.subagents.common import run_subagent
from models import Evidence, NetworkNode

SYSTEM_PROMPT = """You are the Target Neighbor Subagent for DrugThread's Network Investigator. \
You are given one drug's own openFDA pharmacologic-class values. Use the search_pharm_class \
tool with field="pharm_class_moa" and the exact value given to you, to find other drugs \
sharing that same mechanism-of-action class.

The tool returns real, verified drugs from openFDA — never invent a drug that wasn't in the \
tool's results.

Some results will be reformulations or co-formulations of the SAME active ingredient as the \
origin drug (e.g. combined with an enzyme like hyaluronidase, or a subcutaneous version) — \
exclude these, they are not a different drug.

From the genuinely distinct drugs remaining, select up to 3 that most clearly target the same \
specific receptor as the origin drug. For each, set `target` (the shared target name), \
`mechanism` (brief), `status` ("Approved" unless you have reason to think otherwise), and \
`evidenceIds` (must be exactly the evidence id given for that candidate — never invent one).
"""


def find_target_neighbors(
    origin_brand: str, origin_generic: str, moa_class: str, target_name: str | None
) -> tuple[list[NetworkNode], list[Evidence]]:
    prompt = (
        f"Origin drug: {origin_brand} ({origin_generic})\n"
        f"Origin pharm_class_moa: {moa_class}\n"
        f"Origin target: {target_name or 'unknown'}\n\n"
        "Find target neighbors now."
    )
    return run_subagent(SYSTEM_PROMPT, prompt, origin_brand, tool_mode="exact_class")
