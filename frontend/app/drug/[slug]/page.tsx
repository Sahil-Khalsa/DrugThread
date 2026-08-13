'use client'

import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { getDossier } from '@/lib/fixture'
import { useInvestigationAnimation } from '@/lib/useInvestigationAnimation'
import type { HistoryEvent } from '@shared/types'
import DossierHeader from '@/components/DossierHeader'
import InvestigationStatus from '@/components/InvestigationStatus'
import InvestigationProgress from '@/components/InvestigationProgress'
import AgentFindings from '@/components/AgentFindings'
import TrialTimeline from '@/components/TrialTimeline'
import LabelPanel from '@/components/LabelPanel'
import NetworkGraph from '@/components/NetworkGraph'
import FailedTrialDrawer from '@/components/FailedTrialDrawer'
import EvidenceDrawer from '@/components/EvidenceDrawer'

type Tab = 'label' | 'network' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'network', label: 'Network' },
  { id: 'label', label: 'Label' },
]

export default function DossierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const dossier = getDossier(slug)

  const [phase, setPhase] = useState<'investigating' | 'ready'>('investigating')
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [selectedSetback, setSelectedSetback] = useState<HistoryEvent | null>(null)
  const [evidenceIds, setEvidenceIds] = useState<string[] | null>(null)

  // Hooks must be called unconditionally — passes empty array when dossier is null
  const { animSteps, isComplete } = useInvestigationAnimation(
    dossier?.agentRun.steps ?? []
  )

  useEffect(() => {
    if (isComplete && dossier) {
      const t = setTimeout(() => setPhase('ready'), 1200)
      return () => clearTimeout(t)
    }
  }, [isComplete, dossier])

  if (!dossier) {
    return (
      <div className="min-h-screen bg-dt-bg flex flex-col items-center justify-center gap-4">
        <p className="text-dt-muted text-lg">No dossier found for &quot;{slug}&quot;</p>
        <p className="text-dt-muted text-sm">Try searching for Keytruda or Pembrolizumab.</p>
        <Link href="/" className="text-dt-accent text-sm hover:opacity-70 transition-opacity">
          ← Back to search
        </Link>
      </div>
    )
  }

  if (phase === 'investigating') {
    return (
      <div>
        {/* Back nav sits above the investigation screen */}
        <div className="fixed top-4 left-6 z-10">
          <Link href="/" className="text-dt-muted text-sm hover:text-dt-accent transition-colors">
            ← DrugThread
          </Link>
        </div>
        <InvestigationProgress
          drug={dossier.drug}
          summary={dossier.summary}
          animSteps={animSteps}
          isComplete={isComplete}
          sourcesChecked={dossier.agentRun.sourcesChecked}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dt-bg animate-fade-in">
      {/* Back nav */}
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <Link href="/" className="text-dt-muted text-sm hover:text-dt-accent transition-colors">
          ← DrugThread
        </Link>
      </div>

      {/* Drug header */}
      <DossierHeader drug={dossier.drug} summary={dossier.summary} />

      {/* Investigation trace (collapsed summary) */}
      <InvestigationStatus
        steps={dossier.agentRun.steps}
        sourcesChecked={dossier.agentRun.sourcesChecked}
        status={dossier.agentRun.status}
      />

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-dt-border" />
      </div>

      {/* Agent Findings */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <AgentFindings
          findings={dossier.findings}
          evidence={dossier.evidence}
          onEvidenceOpen={ids => setEvidenceIds(ids)}
          onTabChange={tab => setActiveTab(tab)}
        />
      </div>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-dt-border" />
      </div>

      {/* Tab nav */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex gap-1 pt-4 pb-0 border-b border-dt-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-dt-accent text-dt-accent'
                  : 'border-transparent text-dt-muted hover:text-dt-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'history' && (
        <TrialTimeline
          events={dossier.history.events}
          onSelectSetback={setSelectedSetback}
          onEvidenceOpen={ids => setEvidenceIds(ids)}
        />
      )}
      {activeTab === 'network' && (
        <NetworkGraph
          nodes={dossier.network.nodes}
          edges={dossier.network.edges}
          onEvidenceOpen={ids => setEvidenceIds(ids)}
        />
      )}
      {activeTab === 'label' && (
        <LabelPanel
          label={dossier.label}
          evidence={dossier.evidence}
          onEvidenceOpen={ids => setEvidenceIds(ids)}
        />
      )}

      {/* Drawers */}
      {selectedSetback && (
        <FailedTrialDrawer
          event={selectedSetback}
          evidence={dossier.evidence}
          onClose={() => setSelectedSetback(null)}
        />
      )}
      {evidenceIds && (
        <EvidenceDrawer
          evidenceIds={evidenceIds}
          evidence={dossier.evidence}
          onClose={() => setEvidenceIds(null)}
        />
      )}
    </div>
  )
}
