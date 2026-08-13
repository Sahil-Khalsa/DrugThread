"""Network Investigator agent (spec §13, Agent 2).

Delegates to 3 subagents — target/mechanism/indication neighbors (spec §12) —
then merges, dedupes, and caps the result deterministically. Merging isn't an
LLM job (spec §14).
"""

from agents.network_investigator.subagents.indication_neighbor import find_indication_neighbors
from agents.network_investigator.subagents.mechanism_neighbor import find_mechanism_neighbors
from agents.network_investigator.subagents.target_neighbor import find_target_neighbors
from integrations.fda.client import LabelRecord
from models import Evidence, NetworkEdge, NetworkNode
from resolver import DrugIdentity

MAX_NETWORK_NODES = 8  # spec §9: keep the network to 5-10 meaningful nodes


def build_network(
    identity: DrugIdentity,
    label_record: LabelRecord | None,
    target: str | None,
    mechanism: str | None,
    indications: list[str],
) -> tuple[list[NetworkNode], list[NetworkEdge], list[Evidence]]:
    if label_record is None:
        return [], [], []

    origin_brand = label_record.brandName or identity.brandName or identity.name
    origin_generic = label_record.genericName or identity.genericName or identity.name
    moa_class = (label_record.pharmClassMoa or [None])[0]
    epc_class = (label_record.pharmClassEpc or [None])[0]

    all_nodes: dict[str, NetworkNode] = {}
    all_evidence: dict[str, Evidence] = {}
    edges: list[NetworkEdge] = []

    def _merge(nodes: list[NetworkNode], evidence: list[Evidence], relationship: str) -> None:
        for ev in evidence:
            all_evidence[ev.id] = ev
        for n in nodes:
            if len(all_nodes) >= MAX_NETWORK_NODES:
                return
            key = (n.genericName or n.name).upper()
            if key in all_nodes:
                continue  # already captured via another subagent — first classification wins
            node_id = (n.genericName or n.name).lower().replace(" ", "-")
            n.id = node_id
            all_nodes[key] = n
            edges.append(
                NetworkEdge(
                    id=f"edge-{node_id}",
                    source=identity.id,
                    target=node_id,
                    relationship=relationship,
                )
            )

    if moa_class:
        nodes, evidence = find_target_neighbors(origin_brand, origin_generic, moa_class, target)
        _merge(nodes, evidence, "same_target")

    if epc_class:
        nodes, evidence = find_mechanism_neighbors(origin_brand, origin_generic, epc_class, mechanism)
        _merge(nodes, evidence, "same_mechanism")

    if indications:
        nodes, evidence = find_indication_neighbors(origin_brand, origin_generic, indications)
        _merge(nodes, evidence, "shared_indication")

    return list(all_nodes.values()), edges, list(all_evidence.values())
