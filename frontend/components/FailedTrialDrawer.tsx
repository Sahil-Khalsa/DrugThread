'use client'

import { useEffect } from 'react'
import type { HistoryEvent, Evidence } from '@shared/types'

type Props = {
  event: HistoryEvent
  evidence: Evidence[]
  onClose: () => void
}

const SOURCE_LABELS: Record<string, string> = {
  fda: 'FDA',
  clinicaltrials: 'ClinicalTrials.gov',
  publication: 'Publication',
  sponsor: 'Sponsor',
  conference: 'Conference',
  web: 'Web',
}

const SOURCE_COLORS: Record<string, string> = {
  fda: 'bg-dt-success/10 text-dt-success border-dt-success/20',
  clinicaltrials: 'bg-dt-accent/10 text-dt-accent border-dt-accent/20',
  publication: 'bg-dt-warning/10 text-dt-warning border-dt-warning/20',
  sponsor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  conference: 'bg-dt-muted/10 text-dt-muted border-dt-muted/20',
  web: 'bg-dt-muted/10 text-dt-muted border-dt-muted/20',
}

export default function FailedTrialDrawer({ event, evidence, onClose }: Props) {
  const eventEvidence = evidence.filter(e => event.evidenceIds.includes(e.id))
  const report = event.setbackReport

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-dt-surface border-l border-dt-border z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dt-surface border-b border-dt-border px-6 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-dt-danger text-lg">●</span>
              <span className="text-xs font-mono text-dt-danger uppercase tracking-wider">
                Development Setback
              </span>
              {event.trialId && (
                <span className="font-mono text-xs text-dt-muted bg-dt-surface2 border border-dt-border rounded px-1.5 py-0.5">
                  {event.trialId}
                </span>
              )}
            </div>
            <h2 className="text-dt-text font-semibold leading-snug">{event.title}</h2>
            {event.phase && (
              <p className="text-dt-muted text-xs mt-0.5">{event.phase} · {event.year}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-dt-muted hover:text-dt-text transition-colors flex-shrink-0 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-8">
          {report ? (
            <>
              <Section title="What were they testing?">
                <p className="text-dt-muted text-sm leading-relaxed">{report.whatWasTested}</p>
              </Section>

              <Section title="What happened?">
                <div className="bg-dt-danger/5 border border-dt-danger/20 rounded-lg p-4">
                  <p className="text-dt-text text-sm leading-relaxed">{report.whatHappened}</p>
                </div>
              </Section>

              <Section title="Publicly reported explanation">
                <div className="bg-dt-surface2 border border-dt-border rounded-lg p-4">
                  <p className="text-dt-muted text-sm leading-relaxed">{report.publicExplanation}</p>
                  <p className="text-[10px] text-dt-muted/50 mt-3 font-mono">
                    Based on publicly available evidence — not an AI determination of causality.
                  </p>
                </div>
              </Section>

              <Section title="What happened next?">
                <p className="text-dt-muted text-sm leading-relaxed">{report.whatHappenedNext}</p>
              </Section>
            </>
          ) : (
            <div className="text-dt-muted text-sm">
              <p className="mb-2 font-semibold text-dt-text">Event summary</p>
              <p className="leading-relaxed">{event.summary}</p>
              <p className="mt-4 text-xs font-mono text-dt-muted/60">
                No reliable public explanation found for this event.
              </p>
            </div>
          )}

          {/* Evidence */}
          {eventEvidence.length > 0 && (
            <Section title={`Evidence (${eventEvidence.length})`}>
              <div className="space-y-2">
                {eventEvidence.map(ev => (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 bg-dt-surface2 border border-dt-border rounded-lg hover:border-dt-accent/50 transition-colors group"
                  >
                    <span
                      className={`text-[10px] border rounded px-1.5 py-0.5 flex-shrink-0 font-mono ${SOURCE_COLORS[ev.sourceType]}`}
                    >
                      {SOURCE_LABELS[ev.sourceType]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-dt-text text-xs font-medium group-hover:text-dt-accent transition-colors leading-snug">
                        {ev.title}
                      </p>
                      {ev.publisher && (
                        <p className="text-dt-muted text-[10px] mt-0.5">{ev.publisher}</p>
                      )}
                      {ev.date && (
                        <p className="text-dt-muted text-[10px]">{ev.date}</p>
                      )}
                      {ev.excerpt && (
                        <p className="text-dt-muted/70 text-[10px] mt-1 italic leading-relaxed">
                          "{ev.excerpt}"
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-mono text-dt-muted uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  )
}
