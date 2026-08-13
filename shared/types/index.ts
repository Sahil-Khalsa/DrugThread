export type Evidence = {
  id: string
  sourceType: 'fda' | 'clinicaltrials' | 'publication' | 'sponsor' | 'conference' | 'web'
  title: string
  publisher?: string
  url: string
  date?: string
  excerpt?: string
  retrievedAt?: string
  authority: 'primary' | 'secondary' | 'context'
}

export type Finding = {
  id: string
  title: string
  category: 'development' | 'network' | 'label' | 'regulatory'
  severity?: 'info' | 'medium' | 'high'
  summary: string
  evidenceIds: string[]
  confidence: 'primary' | 'secondary' | 'context'
  reviewStatus: 'unreviewed' | 'confirmed' | 'flagged'
  targetTab: 'label' | 'network' | 'history'
}

export type NetworkNode = {
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

export type NetworkEdge = {
  id: string
  source: string
  target: string
  relationship: 'same_target' | 'same_mechanism' | 'shared_indication'
}

export type SetbackReport = {
  whatWasTested: string
  whatHappened: string
  publicExplanation: string
  whatHappenedNext: string
}

export type HistoryEvent = {
  id: string
  date?: string
  year: number
  title: string
  type:
    | 'trial_started'
    | 'trial_result'
    | 'approval'
    | 'setback'
    | 'termination'
    | 'indication_expansion'
    | 'strategy_change'
    | 'other'
  summary: string
  phase?: string
  trialId?: string
  indication?: string
  status?: string
  evidenceIds: string[]
  confidence: 'primary' | 'secondary' | 'context'
  importance: 'low' | 'medium' | 'high'
  setbackReport?: SetbackReport
}

export type AgentRunStep = {
  id: string
  label: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  details?: string
  durationMs?: number
  parentStepId?: string
}

export type DrugDossier = {
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
    status: 'pending' | 'running' | 'complete' | 'failed'
    steps: AgentRunStep[]
    sourcesChecked?: number
  }
}
