<div align="center">

# DrugThread
### Follow every thread behind a drug.

<p>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.11x-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.13-3776ab?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Strands-Agents-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Convoke-MCP-6366f1?style=for-the-badge" />
</p>

**DrugThread** is an agentic pharmaceutical intelligence platform. Given a drug name, a hierarchy of AI agents reconstructs a complete, source-backed dossier covering the FDA label, the biological network, the full clinical-development history including every failure, and cross-sectional findings connecting all three.

> A researcher asking "what happened with Keytruda in triple-negative breast cancer?" used to mean hours in PubMed. DrugThread answers in seconds, with sources.

[Architecture](#system-architecture) · [Agent Hierarchy](#agent-hierarchy) · [MCP Servers](#mcp-servers--api-keys) · [Data Sources](#data-sources) · [Quick Start](#quick-start)

</div>

---

## What DrugThread Does Differently

| Typical Drug Research | DrugThread |
|---|---|
| Search multiple databases manually | Single query triggers a multi-agent investigation |
| No connection between label, trials, and mechanisms | Four views unified under one evidence model |
| Raw PubMed abstracts | Structured findings with confidence derived from source authority |
| Clinical failures buried in trial registries | Failed trials surfaced with setback reports |
| No provenance on claims | Every finding links to its evidence sources |
| Static snapshots | Agent execution trace visible in real time |

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        DrugThread: Request Flow                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  User                                                                        ║
║  ─────                                                                       ║
║  Types "Keytruda" → clicks Investigate                                       ║
║         │                                                                    ║
║         ▼                                                                    ║
║  ┌─────────────────────────────────────────────┐                            ║
║  │  Frontend  (Next.js 15, localhost:3000)      │                            ║
║  │                                              │                            ║
║  │  • Landing page  →  /drug/[slug]             │                            ║
║  │  • Investigation animation (AgentRunStep     │                            ║
║  │    stream, step-by-step reveal)              │                            ║
║  │  • Dossier: History · Network · Label tabs   │                            ║
║  │  • Agent Findings panel (cross-sectional)    │                            ║
║  │  • Failed Trial Drawer + Evidence Drawer     │                            ║
║  └──────────────┬──────────────────────────────┘                            ║
║                 │  GET /api/dossier/:runId/events  (SSE stream)              ║
║                 ▼                                                            ║
║  ┌─────────────────────────────────────────────┐                            ║
║  │  Backend  (FastAPI, localhost:8000)          │                            ║
║  │                                              │                            ║
║  │  • POST /api/investigate  →  starts run      │                            ║
║  │  • GET  /api/dossier/:id/events  →  SSE      │                            ║
║  │  • Evidence validator (rejects zero-source   │                            ║
║  │    output before it reaches the frontend)    │                            ║
║  └──────────────┬──────────────────────────────┘                            ║
║                 │  orchestrates                                               ║
║                 ▼                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                    Strands Orchestrator                              │    ║
║  │  Powered by:  strands-agents[openai]  ·  OpenAI API                 │    ║
║  │  Three agents run in PARALLEL, then Case Synthesizer merges         │    ║
║  └──────┬──────────────────┬──────────────────────┬────────────────────┘    ║
║         │                  │                       │                         ║
║         ▼                  ▼                       ▼                         ║
║  ┌────────────┐   ┌─────────────────┐   ┌───────────────────────┐          ║
║  │   Label    │   │    Network      │   │   Trial Historian      │          ║
║  │  Analyst   │   │  Investigator   │   │                        │          ║
║  │            │   │                 │   │  ClinicalTrials.gov    │          ║
║  │  openFDA   │   │  Convoke MCP    │   │  + Bright Data         │          ║
║  │  (label,   │   │  (protein nets, │   │  (sponsor releases,    │          ║
║  │  adverse   │   │  targets,       │   │  publications,         │          ║
║  │  reactions,│   │  pathways)      │   │  conference reports)   │          ║
║  │  warnings) │   │  + openFDA      │   │        │               │          ║
║  └────────────┘   │       │         │   │        ▼               │          ║
║                   │       ▼         │   │  Setback Investigator  │          ║
║                   │  3 subagents    │   │  (spawned per failed   │          ║
║                   │  ─────────────  │   │   trial, capped 2-3)   │          ║
║                   │  · Target       │   └───────────────────────┘          ║
║                   │    neighbor     │                                         ║
║                   │  · Mechanism    │                                         ║
║                   │    neighbor     │                                         ║
║                   │  · Indication   │                                         ║
║                   │    neighbor     │                                         ║
║                   └─────────────────┘                                        ║
║                            │                                                  ║
║                            ▼ merged, deduped                                 ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │                      Case Synthesizer                                 │   ║
║  │  Merges all three agent outputs → generates Findings                  │   ║
║  │  Confidence derived deterministically from lowest evidence.authority  │   ║
║  │  (never asserted by the model)                                        │   ║
║  └──────────────────────────────────────────────────────────────────────┘   ║
║                            │                                                  ║
║                            ▼                                                  ║
║                    DrugDossier  (shared TypeScript contract)                 ║
║                    streamed to frontend as SSE AgentRunStep events           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Agent Hierarchy

DrugThread uses **four Strands agents** with selective subagent fan-out. The hierarchy is deliberate: Label Analyst and Case Synthesizer are flat, Network Investigator and Trial Historian fan out.

| Agent | Role | Subagents | Data Source |
|---|---|---|---|
| **Label Analyst** | Extracts indications, warnings, adverse reactions, mechanisms from FDA label | None (flat) | openFDA |
| **Network Investigator** | Maps biological network: same target, same mechanism, shared indication | 3 subagents (target neighbor · mechanism neighbor · indication neighbor) | Convoke MCP + openFDA |
| **Trial Historian** | Reconstructs clinical development timeline including failures | Setback Investigator (1 per failed trial, capped at 2-3) | ClinicalTrials.gov + Bright Data |
| **Case Synthesizer** | Merges all three into cross-sectional Findings | None (merge-only) | Upstream agent output |

**Confidence derivation rule:** `confidence = lowest Evidence.authority among a finding's evidenceIds`. Authority hierarchy: `primary > secondary > context`. Never asserted by the model, enforced in the validator.

---

## MCP Servers & API Keys

| MCP Server | URI | Purpose | API Key |
|---|---|---|---|
| **Strands Agents** | `uvx strands-agents-mcp-server` | Agent orchestration + LLM execution layer | `OPENAI_API_KEY` in `backend/.env`, team key |
| **Convoke** | `https://mcp.convoke.bio/mcp` | Biopharma knowledge graph: protein interactions, drug targets, biological pathways | Connected via claude.ai custom connectors, no REST key in `.env` |

**Convoke note:** Connected through the claude.ai MCP connector UI. No token required in `.env` for hackathon use. If a direct REST key is needed for the production backend, add it as `CONVOKE_API_KEY`.

---

## Data Sources

| Source | Access | Used For |
|---|---|---|
| **openFDA** | Public REST API, no key required | FDA drug labels, adverse events, drug interactions |
| **ClinicalTrials.gov** | Public REST API, no key required | Trial registry, phases, outcomes, termination reasons |
| **Bright Data** | `BRIGHT_DATA_API_KEY` in `backend/.env` | Gap-filling investigation: sponsor press releases, publication abstracts, conference reports |
| **Convoke** | Via MCP | Biological networks, protein targets, mechanism pathways |

openFDA and ClinicalTrials.gov are authoritative. Bright Data is the gap-filling layer, only invoked when structured sources are incomplete.

---

## Dossier Structure

Each completed investigation produces a `DrugDossier` with four views:

| View | Contents |
|---|---|
| **History** | Vertical clinical timeline: approvals, label expansions, failed trials. Setback events are clickable and open a Setback Drawer with what was tested, what happened, the public explanation, and what came next |
| **Network** | Interactive biological network graph: drug nodes, relationship edges (same target / mechanism / indication), clickable node detail panel |
| **Label** | Current FDA prescribing information: mechanism, indications, warnings, adverse reactions, all source-linked |
| **Agent Findings** | Cross-sectional insights synthesized from all three agents. Each finding has confidence, severity, reviewStatus, and links back to evidence sources |

---

## Evidence Model

Every claim (`Finding`, `HistoryEvent`, `NetworkNode`, and label section) carries `evidenceIds: string[]` pointing into a shared `Evidence[]` array. Nothing is displayed without a source.

```
Evidence.authority:
  primary   →  FDA filing, ClinicalTrials.gov official record
  secondary →  Peer-reviewed publication, sponsor press release
  context   →  Conference abstract, news report, background reference

Finding.confidence = lowest authority among its evidenceIds (deterministic, not model-asserted)
```

---

## Project Structure

```
DrugThread/
├── shared/
│   └── types/
│       └── index.ts              # Canonical DrugDossier TypeScript contract
│                                 # Frontend fixture and backend both implement this
│
├── frontend/                     # Next.js 15, localhost:3000
│   ├── app/
│   │   ├── layout.tsx            # Root layout, theme toggle, anti-flash script
│   │   ├── page.tsx              # Landing: search input + quick pills
│   │   └── drug/[slug]/
│   │       └── page.tsx          # Dossier page (investigation → reveal)
│   ├── components/
│   │   ├── InvestigationProgress.tsx  # Full-screen step animation
│   │   ├── InvestigationStatus.tsx    # Collapsible execution trace (post-reveal)
│   │   ├── AgentFindings.tsx          # Cross-sectional findings grid
│   │   ├── DossierHeader.tsx          # Drug identity header
│   │   ├── TrialTimeline.tsx          # Vertical clinical history
│   │   ├── NetworkGraph.tsx           # @xyflow/react biological network
│   │   ├── LabelPanel.tsx             # FDA label sections
│   │   ├── FailedTrialDrawer.tsx      # Setback detail slide-over
│   │   ├── EvidenceDrawer.tsx         # Source evidence slide-over
│   │   ├── ConfidenceBadge.tsx        # primary/secondary/context badge
│   │   └── ThemeToggle.tsx            # Dark/light mode toggle
│   └── lib/
│       ├── fixture.ts                 # Keytruda hand-authored fixture (dev-time)
│       └── useInvestigationAnimation.ts  # Step-by-step animation hook
│
├── backend/                      # FastAPI, localhost:8000
│   ├── agents/
│   │   ├── label_analyst/        # FDA label extraction agent
│   │   ├── network_investigator/ # Biological network + 3 subagents
│   │   │   └── subagents/
│   │   ├── trial_historian/      # Clinical timeline + Setback Investigator
│   │   │   ├── agent.py
│   │   │   └── subagents/
│   │   │       └── setback_investigator.py
│   │   └── case_synthesizer/     # Merge + findings generation
│   ├── integrations/
│   │   ├── fda/                  # openFDA client
│   │   ├── clinicaltrials/       # ClinicalTrials.gov client
│   │   ├── brightdata/           # Bright Data client
│   │   └── convoke/              # Convoke integration
│   ├── api/
│   │   └── main.py               # FastAPI routes
│   ├── models.py                 # Pydantic models (mirrors shared/types)
│   ├── resolver.py               # Drug name → canonical identifier
│   ├── requirements.txt
│   └── .env.example
│
└── fixtures/
    └── keytruda.json             # Backend reference fixture (canonical shape)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- OpenAI API key (for Strands agent LLM execution)
- Bright Data API key (for gap-filling investigation layer)

### 1 - Frontend (works standalone with fixture data)

```bash
cd DrugThread/frontend
npm install
npm run dev
# → http://localhost:3000
```

Open `http://localhost:3000`, search **Keytruda** or **Pembrolizumab**. The full investigation animation and dossier run from the local fixture with no backend required.

### 2 - Backend

```bash
cd DrugThread

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Fill in: OPENAI_API_KEY, BRIGHT_DATA_API_KEY

# Start API server
uvicorn backend.api.main:app --reload --port 8000
# → http://localhost:8000
```

### 3 - Connect MCP Servers (for development with Claude Code)

**Strands Agents:**
```bash
claude mcp add strands uvx strands-agents-mcp-server
```

**Convoke** - connect via claude.ai custom connectors UI:
- URL: `https://mcp.convoke.bio/mcp`
- No API key required for hackathon use

### 4 - Wire Frontend to Real Backend

When backend is ready, replace the one line in `frontend/lib/fixture.ts`:

```ts
// Before (fixture):
export function getDossier(slug: string): DrugDossier | null { ... }

// After (real API):
export async function getDossier(slug: string): Promise<DrugDossier | null> {
  const res = await fetch(`/api/investigate`, { method: 'POST', body: JSON.stringify({ drug: slug }) })
  return res.ok ? res.json() : null
}
```

The SSE animation (`useInvestigationAnimation`) swaps to a real-time stream hook that consumes `GET /api/dossier/:runId/events`.

---

## Team

| Person | Responsibility |
|---|---|
| **Nesh** | Frontend: Next.js app, investigation animation, all UI components, shared TypeScript contract, fixture data |
| **Sahil** | Backend: Strands agent implementations, API routes, data source integrations, evidence validator |

Both sides build against the shared `DrugDossier` type in `shared/types/index.ts`. Frontend uses the hand-authored `fixture.ts` until backend is wired in.

---

<sub>Next.js · TypeScript · FastAPI · Python · Strands Agents · Convoke · openFDA · ClinicalTrials.gov · Bright Data · @xyflow/react · Tailwind CSS</sub>

</div>
