'use client'

import { useEffect } from 'react'
import type { Evidence } from '@shared/types'

type Props = {
  evidenceIds: string[]
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

const AUTHORITY_BADGE: Record<string, string> = {
  primary: 'text-dt-success',
  secondary: 'text-dt-warning',
  context: 'text-dt-muted',
}

export default function EvidenceDrawer({ evidenceIds, evidence, onClose }: Props) {
  const items = evidence.filter(e => evidenceIds.includes(e.id))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-dt-surface border-l border-dt-border z-50 overflow-y-auto">
        <div className="sticky top-0 bg-dt-surface border-b border-dt-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-dt-text font-semibold">Evidence Sources</h2>
            <p className="text-dt-muted text-xs mt-0.5">{items.length} source{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-dt-muted hover:text-dt-text transition-colors text-xl leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {items.map(ev => (
            <a
              key={ev.id}
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-dt-surface2 border border-dt-border rounded-xl hover:border-dt-accent/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`text-[10px] border rounded px-1.5 py-0.5 font-mono flex-shrink-0 ${SOURCE_COLORS[ev.sourceType]}`}>
                  {SOURCE_LABELS[ev.sourceType]}
                </span>
                <span className={`text-[10px] font-mono ${AUTHORITY_BADGE[ev.authority]}`}>
                  {ev.authority}
                </span>
              </div>
              <p className="text-dt-text text-sm font-medium group-hover:text-dt-accent transition-colors leading-snug mb-1">
                {ev.title}
              </p>
              {ev.publisher && (
                <p className="text-dt-muted text-xs">{ev.publisher}</p>
              )}
              {ev.date && (
                <p className="text-dt-muted text-xs">{ev.date}</p>
              )}
              {ev.excerpt && (
                <p className="text-dt-muted/70 text-xs mt-2 italic leading-relaxed border-t border-dt-border pt-2">
                  "{ev.excerpt}"
                </p>
              )}
              <p className="text-dt-accent text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Open source →
              </p>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
