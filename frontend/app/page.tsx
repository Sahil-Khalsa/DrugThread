'use client'

import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = ['Keytruda', 'Semaglutide', 'Humira']

export default function HomePage() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function navigate(drug: string) {
    const slug = drug.trim().toLowerCase().replace(/\s+/g, '-')
    if (slug) router.push(`/drug/${slug}`)
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') navigate(query)
  }

  return (
    <main className="min-h-screen bg-dt-bg flex flex-col items-center justify-center px-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-dt-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl text-center z-10">
        {/* Brand */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-dt-accent animate-pulse" />
          <span className="text-dt-accent text-xs font-mono tracking-widest uppercase">
            Agentic Intelligence
          </span>
        </div>
        <h1 className="text-6xl font-bold tracking-tight text-dt-text mb-3">DrugThread</h1>
        <p className="text-dt-muted text-xl mb-14">Follow every thread behind a drug.</p>

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search a drug — Keytruda, Pembrolizumab..."
            className="flex-1 bg-dt-surface border border-dt-border rounded-xl px-5 py-4 text-dt-text placeholder-dt-muted focus:outline-none focus:border-dt-accent transition-colors text-base"
          />
          <button
            onClick={() => navigate(query)}
            className="bg-dt-accent text-dt-bg font-semibold px-8 py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            Investigate
          </button>
        </div>

        <p className="text-dt-muted text-sm mb-10">
          FDA labels · Clinical trials · Mechanisms · Development history
        </p>

        {/* Quick pills */}
        <div className="flex justify-center gap-3">
          {EXAMPLES.map(drug => (
            <button
              key={drug}
              onClick={() => navigate(drug)}
              className="text-dt-muted text-sm border border-dt-border rounded-full px-4 py-2 hover:border-dt-accent hover:text-dt-accent transition-colors"
            >
              {drug}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-dt-muted text-xs opacity-50">
        Powered by Strands · Bright Data · Convoke · openFDA · ClinicalTrials.gov
      </footer>
    </main>
  )
}
