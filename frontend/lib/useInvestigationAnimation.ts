'use client'
import { useState, useEffect } from 'react'
import type { AgentRunStep } from '@shared/types'

export type AnimatedStep = AgentRunStep & {
  animState: 'hidden' | 'running' | 'complete'
}

export function useInvestigationAnimation(steps: AgentRunStep[]) {
  const [animSteps, setAnimSteps] = useState<AnimatedStep[]>(
    steps.map(s => ({ ...s, animState: 'hidden' as const }))
  )
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (steps.length === 0) {
      setIsComplete(true)
      return
    }

    let cancelled = false

    const topLevel = steps.filter(s => !s.parentStepId)

    async function run() {
      for (const step of topLevel) {
        if (cancelled) return

        setAnimSteps(prev =>
          prev.map(s => (s.id === step.id ? { ...s, animState: 'running' } : s))
        )

        const children = steps.filter(s => s.parentStepId === step.id)

        if (children.length > 0) {
          await sleep(350)
          if (cancelled) return

          for (const child of children) {
            if (cancelled) return
            setAnimSteps(prev =>
              prev.map(s => (s.id === child.id ? { ...s, animState: 'running' } : s))
            )
            await sleep(520)
            if (cancelled) return
            setAnimSteps(prev =>
              prev.map(s => (s.id === child.id ? { ...s, animState: 'complete' } : s))
            )
          }

          await sleep(220)
          if (cancelled) return
        } else {
          const delay = clamp((step.durationMs ?? 800) / 3, 350, 1000)
          await sleep(delay)
          if (cancelled) return
        }

        setAnimSteps(prev =>
          prev.map(s => (s.id === step.id ? { ...s, animState: 'complete' } : s))
        )
      }

      await sleep(600)
      if (!cancelled) setIsComplete(true)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [steps])

  return { animSteps, isComplete }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}
