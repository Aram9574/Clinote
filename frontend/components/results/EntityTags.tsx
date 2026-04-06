import type { ClinicalEntities } from '@/types/clinical'

interface EntityTagsProps {
  entities: ClinicalEntities
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? 'bg-teal-400' : confidence >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`}
      title={`Confianza: ${Math.round(confidence * 100)}%`}
    />
  )
}

export function EntityTags({ entities }: EntityTagsProps) {
  return (
    <div className="space-y-6">
      {entities.chief_complaint && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-2">
            Motivo de consulta
          </h3>
          <p className="text-sm text-cream-50 bg-navy-800 rounded-lg px-4 py-3 font-mono">
            {entities.chief_complaint}
          </p>
        </div>
      )}

      {entities.diagnoses.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-3">
            Diagnósticos ({entities.diagnoses.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {entities.diagnoses.map((diag, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity ${
                  diag.negated
                    ? 'bg-navy-700 border-navy-600 text-cream-50/30 line-through'
                    : diag.temporal === 'historical'
                    ? 'bg-navy-700 border-navy-600 text-cream-50/60'
                    : 'bg-teal-400/10 border-teal-400/20 text-teal-400'
                }`}
              >
                <ConfidenceDot confidence={diag.confidence} />
                {diag.display}
                {diag.temporal !== 'current' && !diag.negated && (
                  <span className="opacity-60">({diag.temporal === 'historical' ? 'antec.' : 'familiar'})</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {entities.medications.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-3">
            Medicamentos ({entities.medications.length})
          </h3>
          <div className="space-y-2">
            {entities.medications.map((med, i) => (
              <div key={i} className="flex items-center gap-3 bg-navy-800 rounded-lg px-4 py-2.5">
                <span className="text-sm font-medium text-cream-50">{med.name}</span>
                {med.dose && <span className="text-xs text-cream-50/50">{med.dose}</span>}
                {med.frequency && <span className="text-xs text-cream-50/40">{med.frequency}</span>}
                {med.route && <span className="text-xs bg-navy-700 text-cream-50/50 px-2 py-0.5 rounded">{med.route}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {entities.lab_values.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-3">
            Analítica ({entities.lab_values.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {entities.lab_values.map((lab, i) => (
              <div key={i} className={`bg-navy-800 rounded-lg px-4 py-2.5 border ${
                lab.flag === 'critical' ? 'border-red-500/30' :
                lab.flag === 'high' || lab.flag === 'low' ? 'border-amber-500/20' :
                'border-transparent'
              }`}>
                <p className="text-xs text-cream-50/50">{lab.name}</p>
                <p className={`text-sm font-mono font-medium ${
                  lab.flag === 'critical' ? 'text-red-400' :
                  lab.flag === 'high' || lab.flag === 'low' ? 'text-amber-400' :
                  'text-cream-50'
                }`}>
                  {lab.value} {lab.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entities.vitals.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-3">
            Constantes ({entities.vitals.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {entities.vitals.map((vital, i) => (
              <div key={i} className="bg-navy-800 rounded-lg px-4 py-2.5">
                <p className="text-xs text-cream-50/50">{vital.type}</p>
                <p className="text-sm font-mono font-medium text-cream-50">
                  {vital.value} {vital.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entities.allergies.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-cream-50/50 uppercase tracking-wider mb-3">
            Alergias ({entities.allergies.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {entities.allergies.map((allergy, i) => (
              <span key={i} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400">
                {allergy.substance}
                {allergy.reaction && <span className="opacity-60"> ({allergy.reaction})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
