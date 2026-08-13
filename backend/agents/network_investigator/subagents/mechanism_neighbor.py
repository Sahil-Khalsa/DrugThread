"""Mechanism Neighbor Subagent (spec §12-13): drugs using a related but distinct mechanism."""

from agents.network_investigator.subagents.common import run_subagent
from models import Evidence, NetworkNode

SYSTEM_PROMPT = """You are the Mechanism Neighbor Subagent for DrugThread's Network Investigator. \
You are given one drug's own openFDA established pharmacologic class (EPC). Identify OTHER \
immune/oncology mechanisms that are conceptually related to but distinct from the origin drug's \
own mechanism (e.g. if the origin blocks the PD-1 checkpoint, related-but-distinct mechanisms \
include CTLA-4, LAG-3, or TIGIT blockade).

Call the search_pharm_class_keyword tool with field="pharm_class_epc" and a SHORT keyword for \
that related target (e.g. "CTLA-4", not a full guessed class name — this tool does partial \
matching, so short and specific works far better than a long guessed phrase). Try up to 2 \
different keywords if the first finds nothing. Never invent a drug that wasn't in the tool's \
results — if nothing verifies, return no nodes.

From verified results, select up to 2 drugs. Set `mechanism` to a brief description of their \
(different) mechanism, `target` to their target if inferable from the class name, `status` to \
"Approved" unless you have reason to think otherwise, and `evidenceIds` to exactly the evidence \
id given for that candidate.
"""


def find_mechanism_neighbors(
    origin_brand: str, origin_generic: str, epc_class: str, mechanism_desc: str | None
) -> tuple[list[NetworkNode], list[Evidence]]:
    prompt = (
        f"Origin drug: {origin_brand} ({origin_generic})\n"
        f"Origin pharm_class_epc: {epc_class}\n"
        f"Origin mechanism: {mechanism_desc or 'unknown'}\n\n"
        "Find mechanism neighbors now."
    )
    return run_subagent(SYSTEM_PROMPT, prompt, origin_brand, tool_mode="partial_class")
