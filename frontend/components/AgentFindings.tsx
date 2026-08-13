'use client'

import { useState } from 'react'
import type { Finding, Evidence } from '@shared/types'
import ConfidenceBadge from './ConfidenceBadge'

type Props = {
  findings: Finding[]
  evidence: Evidence[]
  onEvidenceOpen: (ids: string[]) => void
  onTabChange: (tab: 'label' | 'network' | 'history') => void
}

const CATEGORY_ICON: Record<string, string> = {
  development: '🔬',
  network: '◎',
  label: '📋',
  regulatory: '⚖',
}

const SEVERITY_BORDER: Record<string, string> = {
  high: 'border-l-dt-danger',
  medium: 'border-l-dt-warning',
  info: 'border-l-dt-accent',
}

const TAB_LABELS: Record<string, string> = {
  label: 'Label',
  network: 'Network',
  history: 'History',
}

export default function AgentFindings({ findings, evidence, onEvidenceOpen, onTabChange }: Props) {
  const [reviewStates, setReviewStates] = useState<Record<string, 'unreviewed' | 'confirmed' | 'flagged'>>(
    Object.fromEntries(findings.map(f => [f.id, f.reviewStatus]))
  )

  function setReview(id: string, status: 'confirmed' | 'flagged') {
    setReviewStates(prev => ({
      ...prev,
      [id]: prev[id] === status ? 'unreviewed' : status,
    }))
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-6">
      <h2 className="text-xs font-mono text-dt-muted uppercase tracking-widest mb-4">
        Agent Findings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map(finding => {
          const state = reviewStates[finding.id]
          const borderClass = SEVERITY_BORDER[finding.severity ?? 'info']
          const evidenceCount = finding.evidenceIds.length

          return (
            <div
              key={finding.id}
              className={`bg-dt-surface border border-dt-border border-l-2 ${borderClass} rounded-xl p-4 flex flex-col gap-3`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">
                    {CATEGORY_ICON[finding.category]}
                  </span>
                  <span className="font-semibold text-dt-text text-sm leading-snug">
                    {finding.title}
                  </span>
                </div>
                <ConfidenceBadge confidence={finding.confidence} size="xs" />
              </div>

              {/* Summary */}
              <p className="text-dt-muted text-xs leading-relaxed">{finding.summary}</p>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  {/* Evidence count */}
                  {evidenceCount > 0 && (
                    <button
                      onClick={() => onEvidenceOpen(finding.evidenceIds)}
                      className="text-xs text-dt-muted hover:text-dt-accent transition-colors border border-dt-border rounded-full px-2.5 py-0.5"
                    >
                      Sources ({evidenceCount})
                    </button>
                  )}
                  {/* View in tab */}
                  <button
                    onClick={() => onTabChange(finding.targetTab)}
                    className="text-xs text-dt-accent hover:opacity-70 transition-opacity"
                  >
                    View {TAB_LABELS[finding.targetTab]} →
                  </button>
                </div>

                {/* Review controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReview(finding.id, 'confirmed')}
                    title="Confirm finding"
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      state === 'confirmed'
                        ? 'bg-dt-success/20 text-dt-success border-dt-success/40'
                        : 'text-dt-muted border-dt-border hover:border-dt-success hover:text-dt-success'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setReview(finding.id, 'flagged')}
                    title="Flag finding"
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      state === 'flagged'
                        ? 'bg-dt-danger/20 text-dt-danger border-dt-danger/40'
                        : 'text-dt-muted border-dt-border hover:border-dt-danger hover:text-dt-danger'
                    }`}
                  >
                    ⚑
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
