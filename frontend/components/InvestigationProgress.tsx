'use client'

import type { AnimatedStep } from '@/lib/useInvestigationAnimation'
import type { DrugDossier } from '@shared/types'

type Props = {
  drug: DrugDossier['drug']
  summary: DrugDossier['summary']
  animSteps: AnimatedStep[]
  isComplete: boolean
  sourcesChecked?: number
}

export default function InvestigationProgress({
  drug,
  summary,
  animSteps,
  isComplete,
  sourcesChecked,
}: Props) {
  const topLevel = animSteps.filter(s => !s.parentStepId && s.animState !== 'hidden')
  const completeCount = animSteps.filter(s => s.animState === 'complete').length
  const totalCount = animSteps.length
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-dt-bg flex flex-col items-center justify-center px-6 py-16">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-dt-accent/[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Drug header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-dt-text tracking-tight mb-2">
            {(drug.brandName ?? drug.name).toUpperCase()}
          </h1>
          <p className="text-dt-muted text-sm">
            {[drug.genericName, drug.manufacturer, summary.mechanism]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="border-t border-dt-border mb-7" />

        {/* Status label */}
        <div className="mb-6 h-5">
          {isComplete ? (
            <p className="animate-fade-in font-mono text-dt-accent tracking-widest text-xs font-semibold">
              DOSSIER READY
            </p>
          ) : (
            <p className="text-dt-muted text-xs">Opening case file...</p>
          )}
        </div>

        {/* Step list */}
        <div className="space-y-2 font-mono text-sm">
          {topLevel.map(step => {
            const children = animSteps.filter(
              s => s.parentStepId === step.id && s.animState !== 'hidden'
            )

            return (
              <div key={step.id} className="animate-fade-in-up">
                {/* Parent step row */}
                <div className="flex items-start gap-3">
                  <StepIcon state={step.animState} />
                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        step.animState === 'complete' ? 'text-dt-text' : 'text-dt-accent'
                      }
                    >
                      {step.label}
                    </span>
                    {step.details && (
                      <p className="text-dt-muted text-xs mt-0.5 truncate">{step.details}</p>
                    )}
                  </div>
                </div>

                {/* Child steps (subagents) */}
                {children.length > 0 && (
                  <div className="ml-6 mt-1.5 space-y-1.5 pl-4 border-l border-dt-border/60">
                    {children.map(child => (
                      <div key={child.id} className="flex items-start gap-2.5 animate-fade-in-up">
                        <StepIcon state={child.animState} small />
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-xs ${
                              child.animState === 'complete'
                                ? 'text-dt-muted'
                                : 'text-dt-accent/80'
                            }`}
                          >
                            {child.label}
                          </span>
                          {child.details && (
                            <p className="text-[10px] text-dt-muted/60 mt-0.5 truncate">
                              {child.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer: progress bar while running, sources count when done */}
        <div className="mt-10">
          {isComplete ? (
            <div className="animate-fade-in">
              <div className="h-px bg-dt-accent rounded-full" />
              {sourcesChecked != null && (
                <p className="text-xs text-dt-muted mt-3 text-center">
                  {sourcesChecked} sources checked
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-[10px] text-dt-muted mb-2 font-mono">
                <span>{completeCount} / {totalCount} steps</span>
                <span>{pct}%</span>
              </div>
              <div className="h-px bg-dt-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-dt-accent transition-all duration-500 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIcon({ state, small = false }: { state: string; small?: boolean }) {
  const size = small ? 'w-2.5 h-2.5 mt-0.5' : 'w-3 h-3 mt-0.5'
  const textSize = small ? 'text-xs' : 'text-sm'

  if (state === 'complete') {
    return (
      <span className={`text-dt-success flex-shrink-0 leading-none ${textSize}`}>✓</span>
    )
  }
  if (state === 'running') {
    return (
      <div
        className={`flex-shrink-0 rounded-full border border-dt-accent border-t-transparent animate-spin ${size}`}
      />
    )
  }
  return <div className={`flex-shrink-0 ${size}`} />
}
