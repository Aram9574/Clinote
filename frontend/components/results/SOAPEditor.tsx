'use client'

import type { SOAPNote } from '@/types/clinical'

interface SOAPEditorProps {
  soap: SOAPNote
  onChange: (soap: SOAPNote) => void
  onSave: (soap: SOAPNote) => void
}

const SOAP_SECTIONS = [
  { key: 'S' as const, label: 'S — Subjetivo', placeholder: 'Motivo de consulta, síntomas referidos, historia clínica...' },
  { key: 'O' as const, label: 'O — Objetivo', placeholder: 'Constantes vitales, exploración física, valores analíticos...' },
  { key: 'A' as const, label: 'A — Diagnóstico', placeholder: 'Diagnósticos ordenados por relevancia...' },
  { key: 'P' as const, label: 'P — Plan', placeholder: 'Medicamentos, procedimientos, seguimiento...' },
]

export function SOAPEditor({ soap, onChange, onSave }: SOAPEditorProps) {
  const handleChange = (key: keyof SOAPNote, value: string) => {
    onChange({ ...soap, [key]: value })
  }

  // onSave is available for parent to call; exposed via prop
  void onSave

  return (
    <div className="space-y-5">
      {SOAP_SECTIONS.map(section => (
        <div key={section.key}>
          <label className="block text-xs font-semibold text-cream-50/60 uppercase tracking-wider mb-2">
            {section.label}
          </label>
          <textarea
            value={soap[section.key] || ''}
            onChange={(e) => handleChange(section.key, e.target.value)}
            placeholder={section.placeholder}
            rows={5}
            className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-3
                       font-mono text-sm text-cream-50 placeholder:text-cream-50/20
                       focus:outline-none focus:border-teal-400 resize-y transition-colors
                       leading-relaxed"
          />
        </div>
      ))}
    </div>
  )
}
