import type { DrugDossier } from '@shared/types'

type Props = {
  drug: DrugDossier['drug']
  summary: DrugDossier['summary']
}

const STATUS_COLORS: Record<string, string> = {
  Approved: 'bg-dt-success/10 text-dt-success border-dt-success/20',
  Investigational: 'bg-dt-warning/10 text-dt-warning border-dt-warning/20',
  Withdrawn: 'bg-dt-danger/10 text-dt-danger border-dt-danger/20',
}

export default function DossierHeader({ drug, summary }: Props) {
  const statusClass =
    STATUS_COLORS[drug.status ?? ''] ?? 'bg-dt-muted/10 text-dt-muted border-dt-muted/20'

  return (
    <div className="border-b border-dt-border bg-dt-surface">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-dt-text">{drug.brandName ?? drug.name}</h1>
              {drug.status && (
                <span className={`text-xs border rounded-full px-2.5 py-0.5 font-mono ${statusClass}`}>
                  {drug.status}
                </span>
              )}
            </div>
            <p className="text-dt-muted text-lg mb-3">{drug.genericName ?? drug.name}</p>

            <div className="flex flex-wrap gap-4 text-sm text-dt-muted">
              {drug.manufacturer && (
                <span>
                  <span className="text-dt-text/50 mr-1">Manufacturer</span>
                  {drug.manufacturer}
                </span>
              )}
              {summary.target && (
                <span>
                  <span className="text-dt-text/50 mr-1">Target</span>
                  {summary.target}
                </span>
              )}
              {summary.mechanism && (
                <span>
                  <span className="text-dt-text/50 mr-1">Mechanism</span>
                  {summary.mechanism}
                </span>
              )}
            </div>
          </div>
        </div>

        {summary.description && (
          <p className="mt-5 text-dt-muted text-sm leading-relaxed max-w-3xl border-t border-dt-border pt-5">
            {summary.description}
          </p>
        )}
      </div>
    </div>
  )
}
