import { CaseCard } from './CaseCard'

interface CasesListProps {
  cases: Array<{
    id: string
    note_type: string
    word_count: number | null
    processing_ms: number | null
    alert_count: number
    critical_alert_count: number
    created_at: string
  }>
  isLoading: boolean
}

export function CasesList({ cases, isLoading }: CasesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-navy-800 rounded-xl border border-navy-600 h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-16 text-cream-50/30 text-sm">
        No hay casos todavía. Analiza tu primera nota clínica.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cases.map(c => <CaseCard key={c.id} caseItem={c} />)}
    </div>
  )
}
