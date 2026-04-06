'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { ProcessingProgress } from '@/components/editor/ProcessingProgress'
import { useAnalyze } from '@/hooks/useAnalyze'
import { fetchCases } from '@/lib/api'
import { Sparkles, CheckCircle } from 'lucide-react'

const EXAMPLE_NOTE =
  'Paciente varón de 68 años con antecedentes de HTA, DM2 y FA. Acude por disnea de esfuerzo progresiva de 2 semanas. TA 158/92 mmHg, FC 88 lpm irregular, SatO2 94% basal. Crepitantes bibasales. BNP 420 pg/mL, Creatinina 1.8 mg/dL, K 5.1 mEq/L. Tratamiento actual: Warfarina 5mg/24h, Metformina 850mg/12h, Bisoprolol 5mg/24h, Enalapril 10mg/12h.'

function WelcomeBanner({ onUseExample }: { onUseExample: () => void }) {
  return (
    <div className="bg-navy-800 border border-teal-400/20 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-teal-400/10 flex items-center justify-center">
          <Sparkles size={18} className="text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-cream-50 mb-1">
            Bienvenido/a a CLINOTE
          </h2>
          <p className="text-xs text-cream-50/55 leading-relaxed mb-4">
            Pega o escribe cualquier nota clínica en español y CLINOTE la analizará automáticamente:
            detectará entidades clínicas, generará un resumen SOAP estructurado y alertará sobre
            posibles interacciones, contraindicaciones o valores fuera de rango.
          </p>

          <div className="space-y-2 mb-5">
            {[
              'Extracción de entidades: diagnósticos, fármacos, analíticas',
              'Resumen SOAP editable y exportable',
              'Alertas clínicas con evidencia bibliográfica',
              'Exportación en formato HL7 FHIR',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-cream-50/50">
                <CheckCircle size={12} className="text-teal-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="bg-navy-700 rounded-lg p-4 mb-4">
            <p className="text-xs text-cream-50/40 mb-2 font-medium uppercase tracking-wide">
              Nota de ejemplo
            </p>
            <p className="text-xs text-cream-50/65 leading-relaxed font-mono">{EXAMPLE_NOTE}</p>
          </div>

          <button
            onClick={onUseExample}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-400 text-navy-900
                       text-xs font-medium rounded-lg hover:bg-teal-500 transition-colors"
          >
            <Sparkles size={13} />
            Probar con esta nota
          </button>
        </div>
      </div>
    </div>
  )
}

function WelcomeToast({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 bg-navy-800 border border-teal-400/30 rounded-xl
                    px-5 py-3 flex items-center gap-3 shadow-xl z-50 animate-in slide-in-from-bottom-4">
      <Sparkles size={16} className="text-teal-400" />
      <p className="text-sm text-cream-50">¡Bienvenido/a a CLINOTE! Tu cuenta está lista.</p>
      <button onClick={onClose} className="text-cream-50/40 hover:text-cream-50 ml-2 text-lg leading-none">
        ×
      </button>
    </div>
  )
}

export default function EditorPage() {
  const [token, setToken] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [hasNoCases, setHasNoCases] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }
      setToken(session.access_token)

      // Check if new user (no cases yet)
      try {
        const data = await fetchCases(session.access_token)
        const caseCount = data.cases?.length ?? 0
        setHasNoCases(caseCount === 0)
      } catch {
        // silently ignore — don't block editor
      }
    })
  }, [router, supabase.auth])

  // Show toast if redirected after registration
  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setShowWelcomeToast(true)
    }
  }, [searchParams])

  const { state, stages, analyze, reset } = useAnalyze(token || '')

  const handleAnalyze = useCallback(() => {
    if (noteText.trim() && token) {
      analyze(noteText)
    }
  }, [noteText, token, analyze])

  useEffect(() => {
    if (state.isComplete && state.caseId) {
      setTimeout(() => {
        router.push(`/cases/${state.caseId}`)
      }, 500)
    }
  }, [state.isComplete, state.caseId, router])

  if (state.isStreaming || state.isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <ProcessingProgress stages={stages} error={state.error} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {showWelcomeToast && (
        <WelcomeToast onClose={() => setShowWelcomeToast(false)} />
      )}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-cream-50">Nueva nota clínica</h1>
        <p className="text-sm text-cream-50/50 mt-1">
          Pega o escribe la nota clínica en español para su análisis estructurado.
        </p>
      </div>

      {hasNoCases && token && (
        <WelcomeBanner onUseExample={() => setNoteText(EXAMPLE_NOTE)} />
      )}

      <NoteEditor
        value={noteText}
        onChange={setNoteText}
        onSubmit={handleAnalyze}
        isLoading={!token}
      />
    </div>
  )
}
