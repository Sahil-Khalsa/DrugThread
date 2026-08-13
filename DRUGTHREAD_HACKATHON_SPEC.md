# DrugThread — Hackathon Build Specification

> **Biopharma Hack Day — AWS Builder Loft, San Francisco**
>
> Team: 2 developers  
> Build window: same-day hackathon  
> Product type: Agentic pharmaceutical intelligence platform

---

## 1. Product Name

# DrugThread

### Tagline

**Follow every thread behind a drug.**

### One-line pitch

DrugThread is an agentic pharmaceutical intelligence platform that investigates FDA labels, mechanism relationships, clinical trials, and public evidence to reconstruct a drug's regulatory present, biological network, and development history — including the failures usually buried across disconnected sources.

### Memorable framing

**Every drug has a present, a past, and a network of associates. DrugThread follows every thread.**

---

## 2. The Problem

Understanding the full story behind a drug requires searching across several disconnected sources:

- FDA labels
- ClinicalTrials.gov
- scientific literature
- sponsor/company announcements
- conference reports
- public biotech sources
- drug target/mechanism information

These sources are useful individually, but they do not naturally answer:

1. What does the FDA currently say about this drug?
2. What other drugs are biologically or clinically related?
3. How did this drug's clinical-development story unfold?
4. Which trials failed or were terminated?
5. What was publicly reported about those setbacks?
6. What are the most interesting signals someone should notice?

DrugThread turns those disconnected sources into one evidence-backed case file.

---

## 3. Primary Users

Primary hackathon positioning:

- biotech newcomers
- researchers
- competitive-intelligence teams
- pharma operators
- students
- career-switchers
- curious technical builders

### Important positioning decision

Do **not** position DrugThread as a medical decision-support tool.

Do not provide:

- personalized treatment advice
- dosage recommendations
- diagnoses
- claims that two drugs are "safe together"
- patient-specific medical recommendations

DrugThread is an **information and investigation product**, not a clinical decision-maker.

---

## 4. Core Product Model

DrugThread answers four questions.

### 1. LABEL — What is this drug today?

Regulatory and label-based understanding.

### 2. NETWORK — What is this drug connected to?

Biological, mechanism, target, and indication relationships.

### 3. HISTORY — How did this drug get here?

Important clinical-development events, approvals, setbacks, and failed trials.

### 4. AGENT FINDINGS — What should I notice?

AI-generated, source-backed cross-sectional insights connecting Label, Network, and History.

Agent Findings are essential.

Without Agent Findings, DrugThread risks becoming a polished data browser rather than an agentic intelligence product.

---

# 5. Core User Flow

## Step 1 — Search

User searches a drug by:

- brand name
- generic name

Example:

```text
Keytruda
```

or:

```text
Pembrolizumab
```

---

## Step 2 — Investigate Drug

Show a primary CTA:

```text
Investigate Drug
```

After the user clicks it, visibly show the investigation workflow.

Example:

```text
Opening case file...

✓ Resolving drug identity
✓ Retrieving FDA label
✓ Identifying biological target
✓ Searching clinical trial history
✓ Mapping mechanism neighbors
✓ Investigating major setbacks
✓ Searching supporting public evidence
✓ Cross-checking sources

DrugThread ready.
```

This is important because the judges should visibly understand that agents are performing work.

---

## Step 3 — Show Dossier Overview

Example:

```text
KEYTRUDA
Pembrolizumab

PD-1 inhibitor · Merck · Approved
```

Then show:

- Dossier Brief
- 3 Agent Findings
- Label tab
- Network tab
- History tab

---

# 6. Dossier Overview

The top-level page should contain:

## Drug identity

- brand name
- generic name
- manufacturer/sponsor if available
- approval status
- target
- mechanism

## Plain-language summary

A short 2–3 sentence description.

## Key statistics

Possible examples:

- number of trials found
- number of related drugs
- number of major development events
- number of important setbacks
- number of evidence sources checked

Do not surface metrics unless they can be computed reliably.

---

# 7. Agent Findings

Agent Findings appear **before** the three tabs.

The purpose is to answer:

> What are the most interesting things someone should know about this drug?

Show a maximum of 3–4 findings.

Example:

### Development Setback

A Phase III trial in indication X failed its primary endpoint in 2018.

`View in History →`

### Mechanism Landscape

Seven approved or investigational therapies share or interact with the PD-1/PD-L1 pathway.

`View Network →`

### Development Expansion

Clinical development expanded substantially beyond the drug's original indication.

`View History →`

### Label Signal

The FDA label contains a major warning that differs from selected mechanism neighbors.

`View Label →`

Each finding should contain:

```ts
type Finding = {
  id: string
  title: string
  category: "development" | "network" | "label" | "regulatory"
  severity?: "info" | "medium" | "high"
  summary: string
  evidenceIds: string[]
  confidence: "primary" | "secondary" | "context"
  reviewStatus: "unreviewed" | "confirmed" | "flagged"
  targetTab: "label" | "network" | "history"
}
```

### Evidence strength

`confidence` is derived deterministically from the lowest `Evidence.authority` among a finding's `evidenceIds` — a finding resting only on Tier 3/context sources should never carry the same visual weight as one backed by an FDA label. Surface this as a small badge next to each finding (e.g. "Primary source," "Secondary source," "Context only").

### Human review

Every finding should be reviewable, not just readable. Provide a lightweight confirm/flag control on each finding that updates `reviewStatus`. This does not block the demo flow — it's a UI affordance, not a workflow gate — but it directly supports the auditability and human-in-the-loop expectations of the event.

---

# 8. LABEL TAB

## Goal

Answer:

> What does the FDA currently say about this drug?

Use FDA/openFDA data as the authoritative source wherever possible.

### Display

#### What it is

Short plain-language explanation.

#### What it is approved for

List or cards of approved indications.

#### How it works

Plain-language mechanism summary.

#### Major warnings

Important FDA-backed warnings.

#### Common adverse reactions

Selected label-backed adverse reactions.

#### Source provenance

Show:

- source name
- label date/update date if available
- original source link

Provide a:

```text
View Original FDA Source
```

action.

---

## Label Agent Output

```json
{
  "genericName": "pembrolizumab",
  "brandName": "Keytruda",
  "manufacturer": "Merck",
  "mechanism": "",
  "target": "",
  "indications": [],
  "majorWarnings": [],
  "commonAdverseReactions": [],
  "plainLanguageSummary": "",
  "sources": []
}
```

---

## Do NOT build for the MVP

- dosage calculators
- medical advice
- personalized treatment recommendations
- advanced interaction checker
- "safe together" judgments

A compare feature can be added later only if the core product is finished.

---

# 9. NETWORK TAB

## Goal

Answer:

> What other drugs are biologically or clinically related to this drug?

The network should visualize three relationship types.

### Target Neighbor

Drug shares the same biological target.

### Mechanism Neighbor

Drug uses the same or a closely related mechanism.

### Indication Neighbor

Drug is approved for or being investigated in overlapping diseases.

---

## Network Visualization

Keep the MVP small.

Target:

**5–10 meaningful related drug nodes.**

Do not attempt a huge graph.

Example:

```text
                       Drug B
                         ●
                         │
                    Same Target
                         │
Drug C ● ─────────── PD-1 ─────────── ● Keytruda
                         │
                         │
                         ●
                       Drug D
```

---

## Clickable Node Detail

When a user clicks a related drug:

```text
OPDIVO
Nivolumab

Target
PD-1

Relationship
Same target as Keytruda

Status
Approved

Shared indications
• Melanoma
• NSCLC
• RCC

[View Evidence]
```

---

## Network Data Shape

```ts
type NetworkNode = {
  id: string
  name: string
  brandName?: string
  genericName?: string
  target?: string
  mechanism?: string
  status?: string
  sharedIndications?: string[]
  evidenceIds: string[]
}

type NetworkEdge = {
  id: string
  source: string
  target: string
  relationship:
    | "same_target"
    | "same_mechanism"
    | "shared_indication"
}
```

---

# 10. HISTORY TAB

## Goal

Answer:

> What is the actual clinical-development story of this drug?

This should be the **hero feature**.

Do not display a dry list of NCT study IDs.

Convert raw trial data into a narrative timeline.

Example:

```text
2011
│
● Early clinical development
│
│
2014
│
★ First FDA approval
│
│
2016
│
● Indication expansion
│
│
2018
│
🔴 Phase III setback
│   Primary endpoint not met
│
│
2019
│
● Development strategy adjusted
│
│
2021
│
★ New indication approved
│
│
2024
│
● Additional combination studies
```

---

## History Event Shape

```ts
type HistoryEvent = {
  id: string
  date?: string
  year: number
  title: string
  type:
    | "trial_started"
    | "trial_result"
    | "approval"
    | "setback"
    | "termination"
    | "indication_expansion"
    | "strategy_change"
    | "other"
  summary: string
  phase?: string
  trialId?: string
  indication?: string
  status?: string
  evidenceIds: string[]
  confidence: "primary" | "secondary" | "context"
  importance: "low" | "medium" | "high"
}
```

---

# 11. Failed / Terminated Trial Investigation

This is the main demo "wow" feature.

When a timeline event represents a setback, allow the user to open it.

Example:

# Phase III Trial — Development Setback

### What were they testing?

Plain-language summary of:

- trial objective
- population
- intervention
- comparator
- endpoint

### What happened?

Example:

```text
Primary endpoint was not met.
```

### What was publicly reported about the setback?

Use evidence from public sources.

Possible evidence:

- ClinicalTrials.gov
- sponsor press release
- scientific publication
- conference announcement
- other credible public source

### What happened next?

Possible output:

- program discontinued
- indication abandoned
- strategy changed
- trial redesigned
- development continued with a new subgroup
- combination strategy introduced

### Evidence

Every major conclusion should link back to source evidence.

---

## Critical safety/accuracy rule

Do **not** claim:

```text
AI determined why the trial failed.
```

Use wording such as:

```text
Publicly reported reason
```

or:

```text
Available public evidence indicates...
```

If no reliable reason can be found, say:

```text
No reliable public explanation found.
```

Never invent causality.

---

# 12. Agent Architecture

Keep the system to four major agent roles at the top level. Two of those roles further delegate to short-lived subagents for fan-out work — this is a hierarchy, not a flat pipeline.

```text
                 SEARCH
                   │
                   ▼
        ┌────────────────────┐
        │ STRANDS ORCHESTRATOR│
        └─────────┬──────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼

   LABEL       NETWORK      HISTORY
   AGENT        AGENT        AGENT
                  │             │
        ┌─────────┼───────┐     │
        ▼         ▼       ▼     ▼
     Target   Mechanism Indic.  SETBACK
     Neighbor Neighbor  Neighbor INVESTIGATOR
     Subagent Subagent  Subagent (one per failed
                                  trial, capped
                                  at 2–3)

       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
          CASE SYNTHESIZER
                  │
                  ▼
              DRUGTHREAD
```

## Subagent Pattern (Hierarchical Agents)

Use subagents only where a parent agent's job is naturally "run N independent focused investigations and merge them." Do not add hierarchy to agents doing a single macro extraction pass — it adds latency and failure surface without product payoff.

### Where hierarchy is used

- **Network Investigator → 3 subagents**, one per relationship type (target neighbor, mechanism neighbor, indication neighbor). Each subagent retrieves and reasons over its own relationship type independently; the parent agent merges and dedupes their output into the final 5–10 node set.
- **Trial Historian → Setback Investigator subagent**, spawned once per identified failed/terminated trial. Each instance searches Bright Data for sponsor releases, publications, or conference reports about that specific trial and produces the "what happened / what happened next" narrative for it. Cap fan-out at 2–3 setbacks per drug to control latency and cost — this matches the existing rule to keep the network and timeline small and meaningful.

### Where hierarchy is NOT used

- **Label Agent** — single label, single extraction pass. No subagents.
- **Case Synthesizer** — its job is already being the merge point across the three top-level agents. Adding subagents here just adds round-trips for no benefit.

### Why it's worth the added complexity here

Subagent fan-out should be visible in the execution trace (see Section 20) — e.g. "Trial Historian → investigating 3 setbacks in parallel" is a stronger demo beat than a single opaque "searching trials..." step, and it reinforces the "detective system" framing directly.

---

# 13. Agent Responsibilities

## Agent 1 — Label Analyst

### Input

- resolved drug identity
- FDA/openFDA label

### Responsibilities

- extract important label fields
- identify indications
- identify warnings
- identify adverse reactions
- extract mechanism/target where available
- produce a plain-language summary
- preserve citations/source IDs

### Output

Structured JSON only.

---

## Agent 2 — Network Investigator

### Input

- drug identity
- known target/mechanism
- structured drug information
- optional supporting public evidence

### Responsibilities

Delegate to three subagents, one per relationship type:

- **Target Neighbor Subagent** — finds drugs sharing the same biological target
- **Mechanism Neighbor Subagent** — finds drugs sharing the same or closely related mechanism
- **Indication Neighbor Subagent** — finds drugs approved for or investigated in overlapping indications

The parent agent merges, dedupes, and ranks subagent output into a small set of meaningful relationships.

Limit output to a small set of meaningful relationships.

### Output

Network nodes + edges.

---

## Agent 3 — Trial Historian

### Input

- resolved drug identity
- ClinicalTrials.gov records
- external supporting evidence

### Responsibilities

- identify major trials
- identify approvals and expansions
- identify setbacks
- identify failed/terminated trials
- distinguish important events from noisy trials
- create a chronological story
- preserve source provenance

For each identified setback, delegate to a **Setback Investigator subagent** (capped at 2–3 per drug) to investigate the public explanation. Each subagent:

- searches Bright Data for sponsor releases, publications, or conference reports about that specific trial
- produces a source-backed "what happened" / "what happened next" narrative for its one trial
- returns "No reliable public explanation found" if nothing credible turns up, rather than guessing

The parent agent merges subagent results back into the chronological timeline.

### Output

Structured timeline events.

---

## Agent 4 — Case Synthesizer

### Input

- Label Agent output
- Network Agent output
- Trial Historian output

### Responsibilities

Generate:

- 2–3 sentence dossier summary
- 3–4 Agent Findings
- cross-sectional observations
- links from each finding to the correct tab
- source IDs supporting each finding

The Case Synthesizer should **not create unsupported claims**.

---

# 14. Strands Agents

Use Strands as the orchestration layer.

Required properties:

- structured outputs
- explicit agent responsibilities
- visible execution trace
- tool calls should be auditable where practical
- agents should pass structured objects, not long uncontrolled prose

Prefer deterministic transformations for:

- sorting
- deduplication
- status mapping
- date handling
- trial count aggregation
- evidence ID mapping

Use LLM reasoning for:

- extracting salient events
- summarizing evidence
- classifying why an event matters
- producing plain-language narratives
- synthesizing cross-source findings

---

# 15. Bright Data

Bright Data should be the **investigation layer**, not the source of everything.

Use authoritative/structured APIs first.

Example:

```text
ClinicalTrials.gov

Trial = TERMINATED

        ↓

Reason incomplete

        ↓

Bright Data search

        ↓

Sponsor press release
Scientific publication
Conference announcement

        ↓

History Agent

        ↓

Evidence-backed explanation
```

Good Bright Data use cases:

- sponsor announcements
- investor relations releases
- company pipeline pages
- conference announcements
- relevant scientific/public content
- public reporting when official structured data is incomplete

Do not scrape arbitrary low-quality pages and present them as authoritative.

---

# 16. Convoke

Use Convoke as the **biopharma evidence / knowledge layer** if the available hackathon API allows the required workflow.

Conceptually:

```text
FDA ──────────────┐
                  │
Trials ───────────┤
                  │
Bright Data ──────┤
                  ▼
               CONVOKE
          Evidence / Knowledge
                  │
                  ▼
           Strands Agents
```

Desired role:

- store/organize retrieved biopharma context
- preserve evidence
- make source-backed retrieval available
- connect claims/findings to source material
- help maintain provenance

If Convoke integration becomes a blocker, do not let it break the MVP. Keep the evidence interface modular.

---

# 17. Data Sources

Preferred hierarchy:

## Tier 1 — Authoritative

- FDA / openFDA
- ClinicalTrials.gov
- official regulator pages
- official sponsor/company communications

## Tier 2 — Strong supporting sources

- peer-reviewed publications
- conference materials
- reputable scientific sources

## Tier 3 — Context

- credible biotech/public reporting

Avoid presenting weak sources as definitive evidence.

---

# 18. Evidence Model

Every important claim should be traceable.

```ts
type Evidence = {
  id: string
  sourceType:
    | "fda"
    | "clinicaltrials"
    | "publication"
    | "sponsor"
    | "conference"
    | "web"
  title: string
  publisher?: string
  url: string
  date?: string
  excerpt?: string
  retrievedAt?: string
  authority: "primary" | "secondary" | "context"
}
```

Important output objects should contain:

```ts
evidenceIds: string[]
```

Never rely only on free-text URLs embedded inside generated prose.

---

# 19. Shared API / Frontend Contract

Frontend and backend must agree on one shared response shape before building separately.

Suggested structure:

```ts
type DrugDossier = {
  drug: {
    id: string
    name: string
    genericName?: string
    brandName?: string
    manufacturer?: string
    status?: string
  }

  summary: {
    description: string
    mechanism?: string
    target?: string
  }

  findings: Finding[]

  label: {
    indications: string[]
    mechanism?: string
    target?: string
    warnings: string[]
    adverseReactions: string[]
    evidenceIds: string[]
  }

  network: {
    nodes: NetworkNode[]
    edges: NetworkEdge[]
  }

  history: {
    events: HistoryEvent[]
  }

  evidence: Evidence[]

  agentRun: {
    runId: string
    status: "pending" | "running" | "complete" | "failed"
    steps: AgentRunStep[]
    sourcesChecked?: number
  }
}
```

---

# 20. Agent Execution Trace

Expose agent execution to make the system visibly agentic.

Example:

```text
DrugThread Investigation

✓ Drug identity resolved
✓ FDA label retrieved
✓ 487 trial records discovered
✓ Major development events extracted
✓ 11 mechanism neighbors identified (3 subagents: target, mechanism, indication)
✓ 3 setbacks investigated (Setback Investigator × 3, parallel)
✓ 14 supporting evidence sources checked

DOSSIER READY
```

Possible shape:

```ts
type AgentRunStep = {
  id: string
  label: string
  status: "pending" | "running" | "complete" | "failed"
  details?: string
  durationMs?: number
  parentStepId?: string
}
```

`parentStepId` links a subagent step to its parent agent step, so the trace can render nested/grouped fan-out (e.g. three Setback Investigator steps grouped under Trial Historian) instead of a flat list.

Avoid showing hidden model chain-of-thought.

Show only:

- tool/agent name
- action performed
- data source
- structured result summary
- status

---

# 21. Frontend Structure

Suggested route structure:

```text
/
  Landing / Search

/drug/[slug]
  Dossier Overview
  Agent Findings
  Label
  Network
  History
```

Possible components:

```text
components/
  DrugSearch
  InvestigationProgress
  DossierHeader
  AgentFindings
  FindingReviewControl
  ConfidenceBadge
  LabelPanel
  DrugNetwork
  TrialTimeline
  TrialEventCard
  FailedTrialDrawer
  EvidenceDrawer
  SourceBadge
```

---

# 22. Landing Page

Keep it minimal.

Example:

```text
                     DrugThread

           Every drug has a story.
               Follow the threads.

      ┌─────────────────────────────────┐
      │ Search a drug...                │
      └─────────────────────────────────┘

                  Investigate

        FDA labels • Clinical trials
      Mechanisms • Development history
```

Do not lead with sponsor/API names.

The product value comes first.

---

# 23. Dossier Page Layout

Suggested order:

```text
Drug Header

Investigation Status / Metadata

Agent Findings

Tabs:
[Label] [Network] [History]

Evidence Drawer
```

---

# 24. Demo Drug Strategy

Do not try to guarantee perfect behavior for every known drug during the hackathon.

Build the architecture generically, but optimize and test the demo heavily with 3 showcase drugs.

Recommended:

## Hero Demo

**Keytruda / pembrolizumab**

Why:

- recognizable
- rich oncology history
- large clinical-trial footprint
- strong PD-1 mechanism network
- enough material for a compelling development narrative

## Backup

**Semaglutide / Ozempic / Wegovy**

## Backup

**Adalimumab / Humira**

The hero demo must be highly reliable.

---

# 25. MVP Priority

Build in this order.

## P0 — MUST HAVE

### 1. Drug Search

Search resolves a drug reliably.

Example:

```text
Keytruda → Pembrolizumab
```

### 2. History

At least 5 meaningful milestones.

### 3. Failed Trial / Setback Investigation

At least one strong clickable example.

### 4. Evidence

Every important finding should have source provenance.

---

## P1 — HIGH VALUE

### 5. Dossier Brief

Short summary + Agent Findings.

### 6. Network

5–10 related drug nodes.

### 7. Label

Plain-language FDA-backed information.

---

## P2 — ONLY IF CORE IS COMPLETE

- compare drugs
- advanced network filters
- interaction checking
- alerts
- monitoring
- dozens of polished drugs
- advanced settings
- authentication
- user accounts

---

# 26. What NOT to Build

Do not spend hackathon time on:

- authentication
- RBAC
- user profiles
- complex database models
- notification systems
- perfect responsiveness for every screen
- huge knowledge graphs
- hundreds of visualized nodes
- personalized medical advice
- dosage calculations
- generalized interaction safety engine
- fine-tuning
- custom ML training
- elaborate admin panels

A small, polished, evidence-backed demo is better than a broad unfinished platform.

---

# 27. Two-Developer Split

## Developer A — Backend / Intelligence

Own:

1. drug resolver
2. FDA/openFDA integration
3. ClinicalTrials.gov integration
4. Strands orchestration (including Network and Setback Investigator subagents — Section 12)
5. Bright Data investigation
6. evidence normalization + evidence-required validator
7. structured JSON response
8. failed-trial investigation
9. demo safety-net snapshot capture (Section 28)

Priority order:

```text
Drug Search
→ Trial History
→ Failed Trial Investigation
→ Label
→ Network
→ Case Synthesizer
```

---

## Developer B — Frontend / Product

Own:

1. landing/search
2. investigation animation (streamed progress, including subagent steps)
3. dossier page shell
4. Agent Findings + confidence badges + review control
5. timeline
6. failed-trial detail drawer/modal
7. network visualization
8. label view
9. evidence/source drawer

Priority order:

```text
Search
→ Dossier Shell
→ Timeline
→ Failed Trial Detail
→ Findings
→ Network
→ Label
```

---

# 28. Integration Rule

The frontend should not depend on live agent output during early development.

Create fixture JSON matching the shared `DrugDossier` interface.

Example:

```text
fixtures/
  keytruda.json
```

Frontend builds against this fixture.

Backend works toward producing the exact same contract.

When both sides are ready, replace fixture loading with the API.

This prevents the two developers from blocking one another.

## Demo safety net (distinct from the dev fixture)

The dev fixture above is for parallel building and can be hand-written/approximate. Separately, once the real pipeline works end-to-end, capture a **known-good snapshot of an actual full agent run on the hero drug** and store it alongside the fixture (e.g. `fixtures/keytruda.snapshot.json`). If the live pipeline is slow or a provider is flaky during the live demo, swap in this real snapshot rather than falling back to hand-written fixture data — it keeps the demo honest (it's real output, not invented) while removing live-dependency risk at the moment it matters most.

---

# 29. Suggested API Surface

Minimal:

```text
GET /api/drugs/search?q=keytruda
```

Returns identity candidates.

```text
POST /api/dossier
```

Request:

```json
{
  "drugName": "Keytruda"
}
```

Returns either:

- full dossier synchronously, or
- run ID if using streamed/polled execution

Optional:

```text
GET /api/dossier/:runId
```

Prioritize:

```text
GET /api/dossier/:runId/events
```

for SSE/streamed investigation progress. With subagents fanning out (Section 12), a full run takes longer than a single-pass pipeline — a live, streaming progress view keeps the wait feel intentional instead of a dead spinner, and is a stronger demo beat than a synchronous request. Treat this as P1, not a nice-to-have cut under time pressure.

Hackathon preference:

Use the simplest architecture that reliably demos.

---

# 30. Reliability Rules

Agents should never invent missing data.

If data is absent:

```text
Not found in available public evidence.
```

If a setback's cause is unclear:

```text
No reliable public explanation found.
```

If sources disagree:

```text
Conflicting public evidence found.
```

Always distinguish:

- observed fact
- public explanation
- agent synthesis
- uncertainty

## Enforce in code, not just in the schema

A type requiring `evidenceIds: string[]` does not stop a model from emitting an empty array. Add a deterministic validator that runs on every agent output before it reaches the frontend and drops (or downgrades to "unverified") any Finding or HistoryEvent with zero evidence IDs. Do not rely on prompting alone to guarantee provenance.

---

# 31. Source Provenance UX

Every key finding should have a small source indicator.

Example:

```text
Sources (3)
```

Click to open:

```text
FDA Label
ClinicalTrials.gov
Merck Press Release
```

Each source card can show:

- title
- organization
- date
- why it supports the claim
- open source

This creates a strong auditability story.

---

# 32. Suggested Technical Principles

- use structured outputs from agents
- validate every agent response
- keep raw source data separate from generated summaries
- deduplicate trial records
- normalize drug names
- cache demo results where useful
- set API timeouts
- fail gracefully when one evidence source is unavailable
- preserve source URLs
- do not expose model chain-of-thought
- log tool calls and result metadata
- make the hero drug work even if a secondary provider fails
- cap subagent fan-out (network relationship subagents, setback investigations) to control latency and cost
- reject or downgrade agent outputs with empty evidenceIds rather than trusting the schema alone

---

# 33. Demo Script

## 0:00 — Problem

> Understanding a drug today means searching an FDA label, ClinicalTrials.gov, scientific literature, company announcements, and competitor pipelines separately.

## 0:15 — Insight

> And some of the most useful information is buried in what happened along the way — especially the failures.

## 0:25 — Search

Search:

```text
Keytruda
```

## 0:30 — Investigate

Click:

```text
Investigate Drug
```

Show agent workflow.

## 0:45 — Dossier

> DrugThread reconstructs three connected views of a drug.

## 1:00 — Label

> What regulators say about it today.

## 1:20 — Network

> What drugs share its biological neighborhood.

Show the graph.

## 1:50 — History

> And how the clinical-development story unfolded.

Show the timeline.

## 2:15 — Killer Moment

Click a red failed/setback trial.

> Clinical registries often tell us that something stopped. DrugThread investigates supporting public evidence to reconstruct what was publicly reported and what happened afterward.

Show:

- what was tested
- what happened
- public explanation
- next development move
- sources

## 2:50 — Evidence

Open evidence/source drawer.

## 3:10 — Architecture

> Strands orchestrates our investigation agents, Bright Data fills gaps across live public evidence, and Convoke provides the biopharma evidence layer.

## 3:30 — Close

> Every drug has a present, a past, and a network of associates. DrugThread follows every thread.

---

# 34. What Judges Should Remember

Not:

> They made a drug search website.

Desired reaction:

> They built a detective system for drugs.

---

# 35. Recruiter / Portfolio Value

This project should demonstrate:

- agent orchestration
- structured LLM outputs
- tool calling
- multi-source retrieval
- API integration
- evidence provenance
- knowledge graphs
- graph visualization
- clinical/pharma data handling
- human-verifiable AI
- reliability safeguards
- source-aware summarization
- frontend/backend contract design
- agent observability

Do not frame it later as:

> Built a pharma RAG chatbot.

Prefer:

> Built an agentic pharmaceutical intelligence system that reconstructs drug label, mechanism-network, and clinical-development evidence from FDA, trial, and public sources with source-level provenance.

---

# 36. Definition of Done

The hackathon MVP is done when:

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
- [ ] Hero demo works without manual intervention
- [ ] Backup fixture/demo data exists in case a provider fails
- [ ] No medical advice is presented
- [ ] Setback Investigator subagent runs for at least one failed trial and its output is visible in the execution trace
- [ ] Findings/events with zero evidence IDs are rejected or downgraded by a code-level validator, not just the type schema
- [ ] Each finding shows a confidence/evidence-strength badge
- [ ] Each finding has a working confirm/flag control
- [ ] A known-good full-run snapshot of the hero drug exists as a live-demo fallback (distinct from the dev fixture)
- [ ] Investigation progress streams in real time (not a static/dead spinner)

---

# 37. Stretch Goals

Only after Definition of Done:

- drug-to-drug comparison
- evidence drift monitoring
- network filters by phase/status
- indication-specific timeline
- side-by-side target landscape
- saved dossiers
- exportable case file
- scheduled monitoring for new trials/evidence
- additional source connectors

---

# 38. Final Product Definition

## DrugThread

**Follow every thread behind a drug.**

DrugThread is an agentic pharmaceutical intelligence platform that investigates FDA labels, mechanism relationships, clinical trials, and public evidence to reconstruct a drug's regulatory present, biological network, and development history — including the failures usually buried across disconnected sources.

The central product idea is simple:

```text
PRESENT  → Label
NETWORK  → Biological + clinical relationships
PAST     → Development history
INSIGHT  → Agent Findings
EVIDENCE → Source provenance
```

The central hackathon experience is:

```text
Search a drug
      ↓
Investigate
      ↓
Agents gather and connect evidence
      ↓
Dossier appears
      ↓
User explores Label / Network / History
      ↓
Failed-trial investigation reveals what happened
      ↓
Every important conclusion remains traceable to evidence
```

---

# 39. Instruction to Claude Code

When implementing this specification:

1. Optimize first for the **hero demo**, not theoretical completeness.
2. Do not expand scope without a clear P0/P1 requirement.
3. Preserve the shared `DrugDossier` data contract.
4. Prefer official structured sources before web search.
5. Use Bright Data only when it adds missing public context.
6. Keep agent roles narrow and structured.
7. Require source provenance for important generated findings.
8. Never invent a reason for a failed trial.
9. Keep the network graph small and meaningful.
10. Make the History timeline and setback investigation the strongest product experience.
11. Build frontend fixtures early so frontend/backend development can run in parallel.
12. If an integration becomes unreliable, preserve the interface and use a deterministic fallback for the demo.
13. Do not expose private chain-of-thought. Show execution steps, tools, sources, and structured outputs only.
14. Avoid medical-advice functionality.
15. Stop adding features once the Definition of Done is satisfied; use remaining time for demo reliability and polish.
16. Only add agent hierarchy (subagents) where the work is genuinely parallel fan-out (Section 12) — do not add nesting to single-pass extraction agents like the Label Agent or Case Synthesizer.
