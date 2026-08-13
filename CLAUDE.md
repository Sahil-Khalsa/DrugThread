# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only the product/technical specification (`DRUGTHREAD_HACKATHON_SPEC.md`) — no application code has been scaffolded yet. There is no build system, package manager, or test runner to document until implementation starts. Update this file with real commands (install, dev server, lint, test, single-test invocation) as soon as the frontend and backend projects exist.

**Read `DRUGTHREAD_HACKATHON_SPEC.md` before implementing anything.** It is the authoritative source for product behavior, data shapes, and constraints — this file only summarizes the architecture that spans multiple sections of it so you don't have to re-read the whole spec every session.

## What DrugThread is

An agentic pharmaceutical intelligence platform: given a drug name, it reconstructs a source-backed dossier answering four questions — **Label** (what does the FDA currently say), **Network** (what's biologically/clinically related), **History** (how did the clinical-development story unfold, including failures), and **Agent Findings** (cross-sectional insights connecting the three). It is explicitly an information/investigation product, not a medical decision-support tool.

## Architecture

**Shared contract first.** Frontend and backend are built in parallel against one shared `DrugDossier` TypeScript type (spec §19) via a hand-written fixture (`fixtures/keytruda.json`) so neither side blocks on the other. Once the real pipeline works end-to-end, a *separate* known-good snapshot of an actual full agent run (`fixtures/keytruda.snapshot.json`) is captured as a live-demo fallback — do not conflate the two; the fixture is for dev-time parallelism, the snapshot is for demo-time reliability (spec §28).

**Agent hierarchy, not a flat pipeline** (spec §12–13). A Strands orchestrator runs three agents in parallel — Label Analyst, Network Investigator, Trial Historian — then a Case Synthesizer merges their output into findings. Two of those agents further delegate to subagents for fan-out work:
- Network Investigator → 3 subagents (target neighbor, mechanism neighbor, indication neighbor), merged/deduped by the parent.
- Trial Historian → Setback Investigator subagent, spawned once per identified failed/terminated trial, **capped at 2–3 per drug**.

Label Agent and Case Synthesizer are intentionally flat (single-pass extraction / merge-only) — do not add subagent nesting to them.

**Evidence model is the backbone** (spec §18). Every `Finding`, `HistoryEvent`, and label claim carries `evidenceIds: string[]` pointing into a shared `Evidence[]` array, and a `confidence: "primary" | "secondary" | "context"` derived deterministically from the lowest `Evidence.authority` among its evidence — never asserted directly by a model. This must be enforced in code (a validator that rejects/downgrades zero-evidence output before it reaches the frontend), not just by the TypeScript types, since types don't stop a model from emitting an empty array.

**Data source hierarchy** (spec §17): FDA/openFDA and ClinicalTrials.gov are authoritative and preferred; Bright Data is a gap-filling investigation layer for public evidence (sponsor releases, publications, conference reports) when structured sources are incomplete — never the primary source for a claim that structured data could answer.

## Hard rules

- **Never invent a reason for a trial failure.** Use "Publicly reported reason," "Available public evidence indicates...," or "No reliable public explanation found." Never claim "AI determined why the trial failed."
- **No medical-advice functionality**: no dosage calculators, personalized treatment recommendations, diagnoses, or "safe together" judgments.
- **Don't expose model chain-of-thought** in the agent execution trace — only tool/agent name, action performed, data source, structured result summary, and status.
- **Keep the network small** (5–10 nodes) and **cap subagent fan-out** (2–3 setback investigations) — this is a deliberate scope constraint, not an oversight.
- Prefer deterministic code for sorting, deduplication, status mapping, date handling, and evidence-ID mapping; reserve LLM reasoning for extraction, summarization, and cross-source synthesis (spec §14).

## Team split

Two developers, split along backend/intelligence vs. frontend/product lines with independent priority orders (spec §27). Build order for both sides follows the P0 → P1 → P2 tiers in spec §25 (Search → History → Failed-Trial Investigation → Evidence is P0; Dossier Brief/Network/Label is P1; comparison/auth/alerts/etc. are P2 and out of scope unless P0/P1 are fully done).

## Demo target

Hero drug is **Keytruda / pembrolizumab**; backups are **Semaglutide** and **Adalimumab** (spec §24). The hero demo must work without manual intervention — optimize reliability for it specifically rather than generic coverage of arbitrary drugs.
