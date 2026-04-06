'use client'

import { FileText, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { CLINICAL_TEMPLATES, getTemplateGroups, type ClinicalTemplate } from '@/lib/clinical-templates'

interface TemplateSelectorProps {
  value: string
  onChange: (id: string) => void
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const groups = getTemplateGroups()
  const selected = CLINICAL_TEMPLATES.find(t => t.id === value) ?? CLINICAL_TEMPLATES[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 bg-navy-800 border border-navy-600
                   rounded-lg text-sm text-cream-50/80 hover:border-teal-400/50 hover:text-cream-50
                   transition-colors w-full"
      >
        <FileText size={14} className="text-teal-400 flex-shrink-0" />
        <span className="flex-1 text-left">
          <span className="font-medium">{selected.name}</span>
          <span className="text-cream-50/40 ml-2 text-xs hidden sm:inline">{selected.description}</span>
        </span>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-navy-800 border border-navy-600
                        rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          {groups.map(group => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs font-semibold text-cream-50/30 uppercase tracking-wider
                              bg-navy-900/50 sticky top-0">
                {group.label}
              </div>
              {group.templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onChange(t.id); setOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 hover:bg-navy-700 transition-colors
                              ${t.id === value ? 'bg-teal-400/10' : ''}`}
                >
                  <span className={`text-sm font-medium ${t.id === value ? 'text-teal-400' : 'text-cream-50'}`}>
                    {t.name}
                  </span>
                  <span className="block text-xs text-cream-50/40 mt-0.5">{t.description}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
