type Props = {
  confidence: 'primary' | 'secondary' | 'context'
  size?: 'sm' | 'xs'
}

const CONFIG = {
  primary: { label: 'Primary source', className: 'bg-dt-success/10 text-dt-success border-dt-success/20' },
  secondary: { label: 'Secondary source', className: 'bg-dt-warning/10 text-dt-warning border-dt-warning/20' },
  context: { label: 'Context only', className: 'bg-dt-muted/10 text-dt-muted border-dt-muted/20' },
}

export default function ConfidenceBadge({ confidence, size = 'sm' }: Props) {
  const { label, className } = CONFIG[confidence]
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs'
  return (
    <span className={`inline-flex items-center border rounded-full px-2 py-0.5 font-mono ${textSize} ${className}`}>
      {label}
    </span>
  )
}
