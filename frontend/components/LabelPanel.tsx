import type { DrugDossier, Evidence } from '@shared/types'

type Props = {
  label: DrugDossier['label']
  evidence: Evidence[]
  onEvidenceOpen: (ids: string[]) => void
}

export default function LabelPanel({ label, evidence, onEvidenceOpen }: Props) {
  const labelEvidence = evidence.filter(e => label.evidenceIds.includes(e.id))
  const fdaSource = labelEvidence.find(e => e.sourceType === 'fda')

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
      {/* Source provenance */}
      {fdaSource && (
        <div className="flex items-center justify-between p-4 bg-dt-success/5 border border-dt-success/20 rounded-xl">
          <div>
            <p className="text-xs font-mono text-dt-success uppercase tracking-wider mb-0.5">
              FDA Authoritative Source
            </p>
            <p className="text-dt-text text-sm font-medium">{fdaSource.title}</p>
            {fdaSource.date && (
              <p className="text-dt-muted text-xs">{fdaSource.date}</p>
            )}
          </div>
          <a
            href={fdaSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-dt-success border border-dt-success/40 rounded-lg px-3 py-1.5 hover:bg-dt-success/10 transition-colors flex-shrink-0"
          >
            View Original FDA Source →
          </a>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mechanism */}
        {label.mechanism && (
          <Card title="How it works">
            <p className="text-dt-muted text-sm leading-relaxed">{label.mechanism}</p>
            {label.target && (
              <div className="mt-3 pt-3 border-t border-dt-border">
                <span className="text-xs text-dt-muted mr-2">Target</span>
                <span className="text-xs font-mono text-dt-accent bg-dt-accent/10 rounded px-2 py-0.5">
                  {label.target}
                </span>
              </div>
            )}
          </Card>
        )}

        {/* Warnings */}
        {label.warnings.length > 0 && (
          <Card title="Major warnings">
            <ul className="space-y-2">
              {label.warnings.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-dt-danger mt-0.5 flex-shrink-0">⚠</span>
                  <span className="text-dt-muted leading-snug">{w}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Indications */}
      {label.indications.length > 0 && (
        <Card title={`Approved indications (${label.indications.length})`}>
          <div className="flex flex-wrap gap-2">
            {label.indications.map((ind, i) => (
              <span
                key={i}
                className="text-xs text-dt-text bg-dt-surface2 border border-dt-border rounded-full px-3 py-1"
              >
                {ind}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Adverse reactions */}
      {label.adverseReactions.length > 0 && (
        <Card title="Common adverse reactions">
          <div className="flex flex-wrap gap-2">
            {label.adverseReactions.map((ar, i) => (
              <span
                key={i}
                className="text-xs text-dt-muted bg-dt-surface2 border border-dt-border rounded-full px-3 py-1"
              >
                {ar}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Evidence sources */}
      {label.evidenceIds.length > 0 && (
        <div>
          <button
            onClick={() => onEvidenceOpen(label.evidenceIds)}
            className="text-sm text-dt-muted hover:text-dt-accent transition-colors"
          >
            Sources ({label.evidenceIds.length}) →
          </button>
        </div>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dt-surface border border-dt-border rounded-xl p-5">
      <h3 className="text-xs font-mono text-dt-muted uppercase tracking-widest mb-4">{title}</h3>
      {children}
    </div>
  )
}
