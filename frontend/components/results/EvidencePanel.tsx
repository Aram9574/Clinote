'use client'

import { useState, useEffect } from 'react'
import { fetchEvidence } from '@/lib/api'
import { ExternalLink, BookOpen } from 'lucide-react'
import type { EvidenceItem } from '@/types/clinical'

interface EvidencePanelProps {
  token: string
  caseId: string
}

function EvidenceSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-navy-800 rounded-xl p-5 animate-pulse">
          <div className="h-3 bg-navy-700 rounded w-3/4 mb-3" />
          <div className="h-2 bg-navy-700 rounded w-1/4 mb-3" />
          <div className="h-2 bg-navy-700 rounded w-full mb-2" />
          <div className="h-2 bg-navy-700 rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

export function EvidencePanel({ token, caseId }: EvidencePanelProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setTimedOut(true)
        setIsLoading(false)
      }
    }, 15000)

    fetchEvidence(token, caseId)
      .then(data => {
        setEvidence(data.evidence || [])
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
      .finally(() => {
        clearTimeout(timeout)
      })

    return () => clearTimeout(timeout)
  }, [token, caseId])

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={14} className="text-teal-400" />
          <span className="text-xs text-cream-50/50">Buscando evidencia científica...</span>
        </div>
        <EvidenceSkeleton />
      </div>
    )
  }

  if (timedOut || evidence.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen size={32} className="text-cream-50/20 mx-auto mb-3" />
        <p className="text-sm text-cream-50/50 mb-1">
          No se encontró evidencia reciente.
        </p>
        <p className="text-xs text-cream-50/30">
          Consulta PubMed directamente para búsquedas avanzadas.
        </p>
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-4 text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          Ir a PubMed <ExternalLink size={11} />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {evidence.map((item, i) => (
        <div key={i} className="bg-navy-800 rounded-xl border border-navy-600 p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="text-sm font-medium text-cream-50 leading-snug flex-1">
              {item.title}
            </h4>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${
              item.source === 'pubmed'
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-teal-400/10 text-teal-400'
            }`}>
              {item.source}
            </span>
            {item.year && <span className="text-xs text-cream-50/40">{item.year}</span>}
          </div>
          {item.summary && (
            <p className="text-xs text-cream-50/60 leading-relaxed line-clamp-2">
              {item.summary}
            </p>
          )}
        </div>
      ))}

      <p className="text-[11px] text-cream-50/25 text-center pt-2">
        Evidencia científica de referencia. Verificar relevancia clínica en cada caso.
      </p>
    </div>
  )
}
