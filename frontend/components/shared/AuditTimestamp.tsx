interface AuditTimestampProps {
  timestamp: string
  label?: string
}

export function AuditTimestamp({ timestamp, label = 'Creado' }: AuditTimestampProps) {
  const formatted = new Date(timestamp).toLocaleString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
  return (
    <span className="text-xs text-cream-50/30 font-mono">
      {label}: {formatted}
    </span>
  )
}
