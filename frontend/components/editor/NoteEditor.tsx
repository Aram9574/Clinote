'use client'

import { useCallback, useEffect, useRef } from 'react'

interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
}

export function NoteEditor({ value, onChange, onSubmit, isLoading }: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const isValid = wordCount >= 20 && wordCount <= 2000

  const wordCountColor = wordCount === 0
    ? 'text-cream-50/30'
    : wordCount < 20
    ? 'text-amber-400'
    : wordCount > 2000
    ? 'text-red-400'
    : 'text-teal-400'

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid && !isLoading) {
      e.preventDefault()
      onSubmit()
    }
  }, [onSubmit, isValid, isLoading])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pega aquí la nota clínica del paciente en español...

Ejemplo: Paciente varón de 65 años con HTA y FA permanente en tratamiento con Warfarina 5mg/día. Acude por revisión. TA 138/84 mmHg, FC 68 lpm irregular. INR 3.8 (supraterapeútico)..."
          className="w-full min-h-[320px] bg-navy-800 border border-navy-600 rounded-xl px-5 py-4
                     font-mono text-sm text-cream-50 placeholder:text-cream-50/25
                     focus:outline-none focus:border-teal-400 resize-y transition-colors
                     leading-relaxed"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${wordCountColor}`}>
            {wordCount} palabras
          </span>
          {wordCount > 0 && wordCount < 20 && (
            <span className="text-xs text-amber-400/70">
              mín. 20 palabras
            </span>
          )}
          {wordCount > 2000 && (
            <span className="text-xs text-red-400/70">
              máx. 2000 palabras
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-cream-50/30 hidden sm:block">
            ⌘↵ para procesar
          </span>
          <button
            onClick={onSubmit}
            disabled={!isValid || isLoading}
            className="px-5 py-2.5 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                       hover:bg-teal-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cargando...' : 'Procesar nota'}
          </button>
        </div>
      </div>
    </div>
  )
}
