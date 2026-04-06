'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchCases } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Clock, FileText, Plus } from 'lucide-react'

interface CaseItem {
  id: string
  note_type: string
  word_count: number | null
  processing_ms: number | null
  alert_count: number
  critical_alert_count: number
  created_at: string
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  ambulatory: 'Ambulatoria',
  emergency: 'Urgencias',
  discharge: 'Alta',
  unknown: 'Desconocido',
}

function CaseSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-navy-800 rounded-xl border border-navy-600 h-[72px] animate-pulse"
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-600 flex items-center justify-center mb-5">
        <FileText size={24} className="text-cream-50/20" />
      </div>
      <h2 className="text-base font-medium text-cream-50/70 mb-2">
        Aún no has procesado ninguna nota
      </h2>
      <p className="text-sm text-cream-50/35 mb-8 max-w-xs">
        Analiza tu primera nota clínica y aquí aparecerán todos tus casos con sus alertas.
      </p>
      <Link
        href="/editor"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-400 text-navy-900
                   text-sm font-medium rounded-lg hover:bg-teal-500 transition-colors"
      >
        <Plus size={16} />
        Nueva nota
      </Link>
    </div>
  )
}

function CaseRow({ caseItem }: { caseItem: CaseItem }) {
  const date = new Date(caseItem.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Link href={`/cases/${caseItem.id}`}>
      <div
        className="bg-navy-800 rounded-xl border border-navy-600 hover:border-navy-500
                    transition-colors px-5 py-4 flex items-center gap-4 cursor-pointer"
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-navy-700">
          <FileText size={14} className="text-cream-50/50" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-cream-50 truncate">
              {NOTE_TYPE_LABELS[caseItem.note_type] || caseItem.note_type}
            </span>
            <span className="text-xs text-cream-50/30 font-mono">{caseItem.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-cream-50/40">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {date}
            </span>
            {caseItem.word_count && <span>{caseItem.word_count} palabras</span>}
            {caseItem.processing_ms && (
              <span>{(caseItem.processing_ms / 1000).toFixed(1)}s</span>
            )}
          </div>
        </div>

        {caseItem.alert_count > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {caseItem.critical_alert_count > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full text-xs">
                <AlertTriangle size={10} />
                {caseItem.critical_alert_count} crítica{caseItem.critical_alert_count !== 1 ? 's' : ''}
              </span>
            )}
            {caseItem.alert_count - caseItem.critical_alert_count > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs">
                {caseItem.alert_count - caseItem.critical_alert_count} alerta{caseItem.alert_count - caseItem.critical_alert_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      try {
        const data = await fetchCases(session.access_token)
        setCases(data.cases || [])
      } catch (err) {
        console.error('Failed to fetch cases:', err)
        setError('No se pudieron cargar los casos. Inténtalo de nuevo.')
      } finally {
        setIsLoading(false)
      }
    })
  }, [router, supabase.auth])

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-cream-50">Mis casos</h1>
          <p className="text-sm text-cream-50/50 mt-1">Historial de notas analizadas.</p>
        </div>
        {!isLoading && cases.length > 0 && (
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-400 text-navy-900
                       text-sm font-medium rounded-lg hover:bg-teal-500 transition-colors"
          >
            <Plus size={14} />
            Nueva nota
          </Link>
        )}
      </div>

      {isLoading ? (
        <CaseSkeleton />
      ) : error ? (
        <div className="bg-navy-800 rounded-xl border border-red-500/30 px-5 py-4">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-cream-50/50 hover:text-cream-50 mt-2 transition-colors"
          >
            Recargar página
          </button>
        </div>
      ) : cases.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseRow key={c.id} caseItem={c} />
          ))}
        </div>
      )}
    </div>
  )
}
