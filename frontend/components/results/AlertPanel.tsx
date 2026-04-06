import type { ClinicalAlert } from '@/types/clinical'
import { AlertTriangle, Info, Pill, Activity, Microscope, BookOpen } from 'lucide-react'

interface AlertPanelProps {
  alerts: ClinicalAlert[]
  onAcknowledge: (alertId: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  drug_interaction: 'Interacción',
  critical_value: 'Valor crítico',
  differential_diagnosis: 'Diagnóstico diferencial',
  drug_disease_interaction: 'Fármaco-enfermedad',
  monitoring_gap: 'Monitorización',
  guideline_deviation: 'Guía clínica',
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  drug_interaction: <Pill size={11} />,
  critical_value: <Activity size={11} />,
  differential_diagnosis: <Microscope size={11} />,
  drug_disease_interaction: <Pill size={11} />,
  monitoring_gap: <Activity size={11} />,
  guideline_deviation: <BookOpen size={11} />,
}

export function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center text-cream-50/30 text-sm">
        Sin alertas detectadas
      </div>
    )
  }

  return (
    <div className="divide-y divide-navy-700">
      {alerts.map((alert, i) => (
        <div
          key={alert.id || i}
          className={`p-4 ${
            alert.severity === 'critical' && !alert.acknowledged
              ? 'bg-red-500/5'
              : ''
          }`}
        >
          <div className="flex items-start gap-2 mb-2">
            {alert.severity === 'critical' ? (
              <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            ) : alert.severity === 'warning' ? (
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Info size={14} className="text-cream-50/40 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/15 text-red-400'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-navy-700 text-cream-50/50'
                }`}>
                  {CATEGORY_ICONS[alert.category]}
                  {CATEGORY_LABELS[alert.category] || alert.category}
                </span>
                {alert.source && (
                  <span className="text-[10px] text-cream-50/25 uppercase tracking-wide">
                    {alert.source}
                  </span>
                )}
              </div>
              <p className="text-xs text-cream-50 leading-relaxed">{alert.message}</p>
              {alert.detail && (
                <p className="text-[11px] text-cream-50/50 mt-1 leading-relaxed">
                  {alert.detail}
                </p>
              )}
            </div>
          </div>

          {alert.severity === 'critical' && !alert.acknowledged && alert.id && (
            <button
              onClick={() => onAcknowledge(alert.id!)}
              className="mt-2 w-full text-xs py-1.5 border border-red-400/30 text-red-400/70
                         rounded hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              Reconocer alerta
            </button>
          )}
          {alert.acknowledged && (
            <p className="text-[10px] text-cream-50/25 mt-1">Reconocida</p>
          )}
        </div>
      ))}
    </div>
  )
}
