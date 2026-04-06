'use client'

import { getTemplate } from '@/lib/clinical-templates'
import type { SOAPNote } from '@/types/clinical'

interface SOAPEditorProps {
  soap: SOAPNote
  templateId?: string | null
  onChange: (soap: SOAPNote) => void
  onSave: (soap: SOAPNote) => void
}

export function SOAPEditor({ soap, templateId, onChange, onSave }: SOAPEditorProps) {
  const template = getTemplate(templateId ?? 'soap')

  const handleChange = (key: string, value: string) => {
    onChange({ ...soap, [key]: value })
  }

  // onSave is available for parent to call; exposed via prop
  void onSave

  return (
    <div className="space-y-5">
      {template.id !== 'soap' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-400/5 border border-teal-400/15 rounded-lg">
          <span className="text-xs text-teal-400 font-medium">{template.name}</span>
          <span className="text-xs text-cream-50/40">{template.description}</span>
        </div>
      )}
      {template.sections.map(section => (
        <div key={section.key}>
          <label className="block text-xs font-semibold text-cream-50/60 uppercase tracking-wider mb-2">
            {section.label}
          </label>
          <textarea
            value={soap[section.key] || ''}
            onChange={(e) => handleChange(section.key, e.target.value)}
            placeholder={section.placeholder ?? `${section.label}...`}
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
