"""Label Analyst agent (spec §13, Agent 1).

Flat, single-pass extraction — no subagents (spec §12). Turns raw FDA label
prose into short, structured, plain-language fields. Fetching the label is
deterministic (spec §14); only extraction/summarization goes through the LLM.
"""

import os
from typing import Literal

from pydantic import BaseModel
from strands import Agent
from strands.models.openai import OpenAIModel

from integrations.fda.client import LabelRecord
from models import Evidence
from resolver import DrugIdentity

SYSTEM_PROMPT = """You are the Label Analyst for DrugThread. You are given the raw FDA label \
text for one drug. Extract short, structured, plain-language information from it. Never state \
anything that is not directly supported by the provided label text — if a section is missing \
or empty, leave the corresponding field empty rather than guessing.

Rules:
- `indications`: short indication names (a few words each, e.g. "Melanoma", "Non-Small Cell \
  Lung Cancer"), not full paragraphs, extracted from the Indications and Usage section.
- `mechanism`: one or two plain-language sentences explaining how the drug works, based on the \
  Mechanism of Action text.
- `target`: the specific biological target if the text states or clearly implies one (e.g. \
  "PD-1"), otherwise null.
- `warnings`: short major warning category names (not full paragraphs) from Warnings and \
  Cautions.
- `adverseReactions`: short common adverse reaction names from the Adverse Reactions section.
- `plainLanguageSummary`: 2-3 plain-language sentences describing what the drug is and what \
  it's approved for, for a non-medical reader.
"""


class LabelOutput(BaseModel):
    indications: list[str]
    mechanism: str | None = None
    target: str | None = None
    warnings: list[str]
    adverseReactions: list[str]
    plainLanguageSummary: str


class LabelResult(BaseModel):
    genericName: str
    brandName: str
    manufacturer: str | None = None
    mechanism: str | None = None
    target: str | None = None
    indications: list[str]
    majorWarnings: list[str]
    commonAdverseReactions: list[str]
    plainLanguageSummary: str
    evidenceIds: list[str]


_MAX_SECTION_CHARS = 4000  # keeps total prompt well under this account's 30K TPM limit


def _truncate(text: str | None) -> str:
    if not text:
        return "Not provided."
    if len(text) <= _MAX_SECTION_CHARS:
        return text
    return text[:_MAX_SECTION_CHARS] + " [...truncated]"


def build_label(
    identity: DrugIdentity, label_record: LabelRecord | None
) -> tuple[LabelResult | None, list[Evidence]]:
    if label_record is None:
        return None, []

    evidence_id = "ev-fda-label"
    evidence = [
        Evidence(
            id=evidence_id,
            sourceType="fda",
            title=f"{label_record.brandName or identity.name} FDA Label",
            publisher="U.S. FDA / openFDA",
            url=(
                f"https://api.fda.gov/drug/label.json?"
                f'search=openfda.brand_name.exact:"{(label_record.brandName or identity.brandName or "").upper()}"'
            ),
            date=label_record.effectiveTime,
            authority="primary",
        )
    ]

    model = OpenAIModel(
        client_args={"api_key": os.environ["OPENAI_API_KEY"]},
        model_id="gpt-4o",
        params={"temperature": 0.1},
    )
    agent = Agent(model=model, system_prompt=SYSTEM_PROMPT)

    prompt = (
        f"Drug: {label_record.brandName} ({label_record.genericName})\n\n"
        f"Indications and Usage:\n{_truncate(label_record.indicationsAndUsage)}\n\n"
        f"Warnings and Cautions:\n{_truncate(label_record.warningsAndCautions)}\n\n"
        f"Adverse Reactions:\n{_truncate(label_record.adverseReactions)}\n\n"
        f"Mechanism of Action:\n{_truncate(label_record.mechanismOfAction)}\n\n"
        "Extract the structured label output now."
    )

    extracted = agent.structured_output(LabelOutput, prompt)

    result = LabelResult(
        genericName=label_record.genericName or identity.genericName or identity.name,
        brandName=label_record.brandName or identity.brandName or identity.name,
        manufacturer=label_record.manufacturerName or identity.manufacturer,
        mechanism=extracted.mechanism,
        target=extracted.target,
        indications=extracted.indications,
        majorWarnings=extracted.warnings,
        commonAdverseReactions=extracted.adverseReactions,
        plainLanguageSummary=extracted.plainLanguageSummary,
        evidenceIds=[evidence_id],
    )
    return result, evidence
