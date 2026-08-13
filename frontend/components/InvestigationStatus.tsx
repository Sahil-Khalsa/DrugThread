import type { AgentRunStep } from '@shared/types'

type Props = {
  steps: AgentRunStep[]
  sourcesChecked?: number
  status: 'pending' | 'running' | 'complete' | 'failed'
}

const STATUS_ICON: Record<string, string> = {
  complete: '✓',
  running: '◌',
  pending: '○',
  failed: '✗',
}

const STATUS_COLOR: Record<string, string> = {
  complete: 'text-dt-success',
  running: 'text-dt-accent animate-pulse',
  pending: 'text-dt-muted',
  failed: 'text-dt-danger',
}

export default function InvestigationStatus({ steps, sourcesChecked, status }: Props) {
  const topLevel = steps.filter(s => !s.parentStepId)

  return (
    <div className="max-w-5xl mx-auto px-6 py-5">
      <details className="group">
        <summary className="flex items-center gap-3 cursor-pointer list-none select-none">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === 'complete'
                ? 'bg-dt-success'
                : status === 'running'
                  ? 'bg-dt-accent animate-pulse'
                  : 'bg-dt-muted'
            }`}
          />
          <span className="text-sm text-dt-muted">
            {status === 'complete' ? (
              <>
                Investigation complete —{' '}
                <span className="text-dt-text">{sourcesChecked ?? 0} sources checked</span>
              </>
            ) : status === 'running' ? (
              'Investigation running…'
            ) : (
              'Investigation status'
            )}
          </span>
          <span className="ml-auto text-dt-muted text-xs group-open:rotate-180 transition-transform">▾</span>
        </summary>

        <div className="mt-4 bg-dt-surface border border-dt-border rounded-xl p-4 font-mono text-xs space-y-1">
          {topLevel.map(step => {
            const children = steps.filter(s => s.parentStepId === step.id)
            return (
              <div key={step.id}>
                <div className="flex items-start gap-2">
                  <span className={STATUS_COLOR[step.status]}>{STATUS_ICON[step.status]}</span>
                  <span className="text-dt-text">{step.label}</span>
                  {step.details && (
                    <span className="text-dt-muted ml-1">— {step.details}</span>
                  )}
                </div>
                {children.map(child => (
                  <div key={child.id} className="flex items-start gap-2 ml-5 mt-0.5">
                    <span className={STATUS_COLOR[child.status]}>{STATUS_ICON[child.status]}</span>
                    <span className="text-dt-muted">{child.label}</span>
                    {child.details && (
                      <span className="text-dt-muted/60 ml-1">— {child.details}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
          {status === 'complete' && (
            <div className="pt-2 border-t border-dt-border text-dt-accent font-semibold">
              DOSSIER READY
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
