'use client'

import type { HistoryEvent } from '@shared/types'
import ConfidenceBadge from './ConfidenceBadge'

type Props = {
  events: HistoryEvent[]
  onSelectSetback: (event: HistoryEvent) => void
  onEvidenceOpen: (ids: string[]) => void
}

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; dotColor: string }
> = {
  approval: { icon: '★', color: 'text-dt-success', dotColor: 'bg-dt-success' },
  setback: { icon: '●', color: 'text-dt-danger', dotColor: 'bg-dt-danger' },
  termination: { icon: '●', color: 'text-dt-danger', dotColor: 'bg-dt-danger' },
  trial_started: { icon: '●', color: 'text-dt-accent', dotColor: 'bg-dt-accent' },
  trial_result: { icon: '●', color: 'text-dt-accent', dotColor: 'bg-dt-accent' },
  indication_expansion: { icon: '◆', color: 'text-dt-warning', dotColor: 'bg-dt-warning' },
  strategy_change: { icon: '◆', color: 'text-dt-warning', dotColor: 'bg-dt-warning' },
  other: { icon: '●', color: 'text-dt-muted', dotColor: 'bg-dt-muted' },
}

const IMPORTANCE_OPACITY: Record<string, string> = {
  high: 'opacity-100',
  medium: 'opacity-80',
  low: 'opacity-50',
}

export default function TrialTimeline({ events, onSelectSetback, onEvidenceOpen }: Props) {
  const sorted = [...events].sort((a, b) => a.year - b.year)

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="relative">
        {/* Vertical spine */}
        <div className="absolute left-[88px] top-0 bottom-0 w-px bg-dt-border" />

        <div className="space-y-0">
          {sorted.map((event, i) => {
            const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.other
            const isSetback = event.type === 'setback' || event.type === 'termination'
            const opacity = IMPORTANCE_OPACITY[event.importance]
            const showYear =
              i === 0 || sorted[i - 1].year !== event.year

            return (
              <div key={event.id} className={`flex gap-0 ${opacity}`}>
                {/* Year column */}
                <div className="w-[88px] flex-shrink-0 pt-4 pr-6 text-right">
                  {showYear && (
                    <span className="text-sm font-mono text-dt-muted">{event.year}</span>
                  )}
                </div>

                {/* Dot */}
                <div className="flex-shrink-0 relative pt-4">
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-dt-bg z-10 relative ${cfg.dotColor}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 ml-5 pb-8 pt-2.5">
                  <button
                    onClick={() => isSetback && onSelectSetback(event)}
                    className={`group text-left w-full ${isSetback ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`text-lg leading-none ${cfg.color} flex-shrink-0`}>
                        {cfg.icon}
                      </span>
                      <div className="min-w-0">
                        <span
                          className={`font-semibold text-sm text-dt-text ${
                            isSetback ? 'group-hover:text-dt-danger transition-colors' : ''
                          }`}
                        >
                          {event.title}
                        </span>
                        {isSetback && (
                          <span className="ml-2 text-xs text-dt-danger opacity-0 group-hover:opacity-100 transition-opacity">
                            Investigate →
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <p className="text-dt-muted text-xs leading-relaxed mb-2 pl-6">
                    {event.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pl-6">
                    {event.trialId && (
                      <span className="font-mono text-[10px] text-dt-muted bg-dt-surface border border-dt-border rounded px-1.5 py-0.5">
                        {event.trialId}
                      </span>
                    )}
                    {event.phase && (
                      <span className="text-[10px] text-dt-muted">{event.phase}</span>
                    )}
                    {event.indication && (
                      <span className="text-[10px] text-dt-muted">· {event.indication}</span>
                    )}
                    <ConfidenceBadge confidence={event.confidence} size="xs" />
                    {event.evidenceIds.length > 0 && (
                      <button
                        onClick={() => onEvidenceOpen(event.evidenceIds)}
                        className="text-[10px] text-dt-muted hover:text-dt-accent transition-colors"
                      >
                        Sources ({event.evidenceIds.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
