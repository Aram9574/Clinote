'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { ClinicalAlert } from '@/types/clinical'

interface CriticalAlertBannerProps {
  alerts: ClinicalAlert[]
  onDismiss: () => void
  onAcknowledgeAll: () => void
}

export function CriticalAlertBanner({ alerts, onDismiss, onAcknowledgeAll }: CriticalAlertBannerProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-400 mb-1">
            {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} crítica{alerts.length !== 1 ? 's' : ''} detectada{alerts.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-0.5">
            {alerts.map((a, i) => (
              <li key={i} className="text-xs text-cream-50/70">{a.message}</li>
            ))}
          </ul>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400
                         border border-red-400/30 rounded hover:bg-red-500/30 transition-colors"
            >
              Reconocer y continuar
            </button>
          ) : (
            <div className="mt-3">
              <p className="text-xs text-amber-400 mb-2">
                Al continuar, confirmas que has revisado estas alertas críticas y actúas bajo tu criterio clínico.
              </p>
              <button
                onClick={onAcknowledgeAll}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-400
                           border border-amber-400/30 rounded hover:bg-amber-500/30 transition-colors"
              >
                Entendido, continúo bajo mi criterio clínico
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-cream-50/30 hover:text-cream-50/60 transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
