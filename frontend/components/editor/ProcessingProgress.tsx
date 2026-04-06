import { Check, Loader2, AlertCircle } from 'lucide-react'
import type { ProcessingStage } from '@/types/clinical'

interface ProcessingProgressProps {
  stages: ProcessingStage[]
  error: string | null
}

export function ProcessingProgress({ stages, error }: ProcessingProgressProps) {
  const doneCount = stages.filter(s => s.done).length
  const currentStageIndex = stages.findIndex(s => !s.done)

  return (
    <div className="w-full max-w-sm">
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-8">
        {error ? (
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-cream-50">Error al procesar</p>
              <p className="text-xs text-cream-50/60 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm font-medium text-cream-50 mb-1">Analizando nota clínica</p>
              <p className="text-xs text-cream-50/50">{doneCount} de {stages.length} pasos completados</p>
            </div>

            <div className="h-1.5 bg-navy-700 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / stages.length) * 100}%` }}
              />
            </div>

            <ul className="space-y-3">
              {stages.map((stage, i) => {
                const isActive = i === currentStageIndex
                const isDone = stage.done

                return (
                  <li key={stage.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {isDone ? (
                        <Check size={14} className="text-teal-400" />
                      ) : isActive ? (
                        <Loader2 size={14} className="text-teal-400 animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-navy-600" />
                      )}
                    </div>
                    <span className={`text-sm transition-colors ${
                      isDone ? 'text-cream-50/50 line-through' :
                      isActive ? 'text-cream-50' :
                      'text-cream-50/30'
                    }`}>
                      {stage.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
