import Link from 'next/link'
import { AlertTriangle, Clock, FileText } from 'lucide-react'

interface CaseCardProps {
  caseItem: {
    id: string
    note_type: string
    word_count: number | null
    processing_ms: number | null
    alert_count: number
    critical_alert_count: number
    created_at: string
  }
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  ambulatory: 'Ambulatoria',
  emergency: 'Urgencias',
  discharge: 'Alta',
  unknown: 'Desconocido',
}

export function CaseCard({ caseItem }: CaseCardProps) {
  const date = new Date(caseItem.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <Link href={`/cases/${caseItem.id}`}>
      <div className="bg-navy-800 rounded-xl border border-navy-600 hover:border-navy-500
                      transition-colors px-5 py-4 flex items-center gap-4 cursor-pointer">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center
                        rounded-lg bg-navy-700">
          <FileText size={14} className="text-cream-50/50" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-cream-50 truncate">
              {NOTE_TYPE_LABELS[caseItem.note_type] || caseItem.note_type}
            </span>
            <span className="text-xs text-cream-50/30 font-mono">
              {caseItem.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-cream-50/40">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {date}
            </span>
            {caseItem.word_count && (
              <span>{caseItem.word_count} palabras</span>
            )}
            {caseItem.processing_ms && (
              <span>{(caseItem.processing_ms / 1000).toFixed(1)}s</span>
            )}
          </div>
        </div>

        {caseItem.alert_count > 0 && (
          <div className="flex items-center gap-2">
            {caseItem.critical_alert_count > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15
                               text-red-400 rounded-full text-xs">
                <AlertTriangle size={10} />
                {caseItem.critical_alert_count}
              </span>
            )}
            {caseItem.alert_count - caseItem.critical_alert_count > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs">
                {caseItem.alert_count - caseItem.critical_alert_count}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
