# DrugThread — Build Status

Live tracker for the hackathon build. Update checkboxes as you go — this is the single source of truth for "what's done and what's left," not a substitute for the full spec (`DRUGTHREAD_HACKATHON_SPEC.md`).

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Team

| Owner | Track | Ref |
|---|---|---|
| **Sahil** | Backend / Intelligence — drug resolver, FDA/openFDA + ClinicalTrials.gov integration, Strands orchestration (agents + subagents), Bright Data investigation, evidence normalization/validator, API | spec §27, §12–14 |
| **Nesh** | Frontend / Product — search UI, investigation animation, dossier shell, Agent Findings + confidence badges/review control, timeline, failed-trial drawer, network viz, label view, evidence drawer | spec §27, §21 |

Contract both sides build against: shared `DrugDossier` type (spec §19) via `fixtures/keytruda.json`.

---

## P0 — Must Have

### Backend (Sahil)
- [ ] Drug resolver (name → identity, e.g. Keytruda → Pembrolizumab)
- [ ] ClinicalTrials.gov integration + Trial Historian agent (major trials, approvals, setbacks)
- [ ] Setback Investigator subagent (Bright Data search per failed trial, capped 2–3)
- [ ] Evidence normalization + evidence-required validator (rejects/downgrades zero-evidence output)
- [ ] `POST /api/dossier` returning data matching `DrugDossier` contract

### Frontend (Nesh)
- [ ] Search input + drug identity resolution UI
- [ ] Dossier page shell (`/drug/[slug]`)
- [ ] Narrative timeline (min. 5 milestones) — the hero feature
- [ ] Failed-trial detail drawer (what was tested / what happened / public explanation / what happened next / sources)
- [ ] Evidence/source drawer wired to `evidenceIds`

---

## P1 — High Value

### Backend (Sahil)
- [ ] Label Analyst agent + FDA/openFDA integration
- [ ] Network Investigator agent + 3 relationship subagents (target/mechanism/indication), merged to 5–10 nodes
- [ ] Case Synthesizer (dossier summary + 3–4 Agent Findings, each with `confidence` derived from evidence authority)
- [ ] Streamed investigation progress endpoint (`GET /api/dossier/:runId/events`)
- [ ] Known-good full-run snapshot of hero drug captured as demo safety net (`fixtures/keytruda.snapshot.json`)

### Frontend (Nesh)
- [ ] Investigation progress animation (consumes streamed steps, shows subagent fan-out)
- [ ] Agent Findings section + `ConfidenceBadge` + `FindingReviewControl`
- [ ] Network visualization (clickable nodes, relationship detail)
- [ ] Label tab (plain-language, FDA-backed)

---

## P2 — Only If Core Is Complete

- [ ] Drug-to-drug comparison
- [ ] Advanced network filters
- [ ] Additional polished demo drugs beyond hero + 2 backups

*(Don't start these before every P0/P1 box above is checked.)*

---

## Definition of Done (spec §36)

- [ ] User can search the hero drug
- [ ] Drug identity resolves correctly
- [ ] Investigation workflow is visibly shown
- [ ] Dossier overview renders
- [ ] At least 3 Agent Findings render
- [ ] Label tab contains real FDA-backed information
- [ ] Network shows 5–10 meaningful related nodes
- [ ] History contains at least 5 major timeline events
- [ ] At least one failed/setback trial can be opened
- [ ] Failed-trial view explains what was tested and what happened
- [ ] Public explanation is source-backed or explicitly marked unknown
- [ ] Major claims expose evidence links
- [ ] Setback Investigator subagent output is visible in the execution trace
- [ ] Findings/events with zero evidence IDs are rejected/downgraded by code, not just schema
- [ ] Each finding shows a confidence badge and a working confirm/flag control
- [ ] Investigation progress streams in real time
- [ ] Hero demo (Keytruda) works without manual intervention
- [ ] Backup snapshot exists in case a live provider fails
- [ ] No medical advice is presented anywhere

---

## Demo Drugs

- **Hero:** Keytruda / pembrolizumab — must be reliable
- **Backup 1:** Semaglutide / Ozempic / Wegovy
- **Backup 2:** Adalimumab / Humira

---

## Notes / Blockers

_(Log anything blocking progress here as it comes up — flaky API, ambiguous spec point, integration not responding, etc.)_

-
