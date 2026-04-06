'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCase } from '@/hooks/useCase'
import { acknowledgeAlert, updateSOAP } from '@/lib/api'
import { AlertPanel } from '@/components/results/AlertPanel'
import { CriticalAlertBanner } from '@/components/results/CriticalAlertBanner'
import { SOAPViewer } from '@/components/results/SOAPViewer'
import { FHIRExportButton } from '@/components/results/FHIRExportButton'
import { copySOAPToClipboard } from '@/lib/export'
import { useToast } from '@/components/shared/Toast'
import type { ClinicalAlert, SOAPNote } from '@/types/clinical'

export default function CasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  const [token, setToken] = useState<string | null>(null)
  const [criticalDismissed, setCriticalDismissed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const toast = useToast()

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setToken(session.access_token)
    })
  }, [router, supabase.auth])

  const { caseData, setCaseData, isLoading } = useCase(token || '', token ? caseId : null)

  const criticalAlerts = caseData?.alerts.filter(a => a.severity === 'critical') || []
  const unacknowledgedCritical = criticalAlerts.filter(a => !a.acknowledged)

  const handleAcknowledge = useCallback(async (alertId: string) => {
    if (!token) return
    await acknowledgeAlert(token, caseId, alertId)
    setCaseData(prev => prev ? {
      ...prev,
      alerts: prev.alerts.map(a =>
        a.id === alertId ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString() } : a
      )
    } : null)
  }, [token, caseId, setCaseData])

  const handleSOAPSave = useCallback(async (soap: SOAPNote) => {
    if (!token) return
    setSaveStatus('saving')
    try {
      await updateSOAP(token, caseId, soap)
      setSaveStatus('saved')
      toast.success('SOAP guardado correctamente')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('idle')
      toast.error('Error al guardar. Inténtalo de nuevo.')
    }
  }, [token, caseId, toast])

  const handleCopySOAP = useCallback(async () => {
    if (caseData?.soap_structured) {
      await copySOAPToClipboard(caseData.soap_structured, caseId)
      toast.success('SOAP copiado al portapapeles')
    }
  }, [caseData, caseId, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cream-50/50 text-sm">Cargando caso...</div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cream-50/50 text-sm">Caso no encontrado.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Critical Alert Banner */}
      {unacknowledgedCritical.length > 0 && !criticalDismissed && (
        <CriticalAlertBanner
          alerts={unacknowledgedCritical}
          onDismiss={() => setCriticalDismissed(true)}
          onAcknowledgeAll={() => {
            unacknowledgedCritical.forEach(a => a.id && handleAcknowledge(a.id))
            setCriticalDismissed(true)
          }}
        />
      )}

      {/* Main two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Alerts (sticky) */}
        <div className="w-80 bg-navy-800 border-r border-navy-600 flex flex-col">
          <div className="p-4 border-b border-navy-600">
            <h2 className="text-sm font-semibold text-cream-50">
              Alertas clínicas
            </h2>
            <p className="text-xs text-cream-50/50 mt-0.5">
              {caseData.alerts.length} alerta{caseData.alerts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <AlertPanel
              alerts={caseData.alerts}
              onAcknowledge={handleAcknowledge}
            />
          </div>
        </div>

        {/* Right column: SOAP + tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <SOAPViewer
            caseData={caseData}
            token={token || ''}
            caseId={caseId}
            onSave={handleSOAPSave}
          />
        </div>
      </div>

      {/* Bottom export bar */}
      <div className="bg-navy-800 border-t border-navy-600 px-6 py-3 flex items-center gap-3">
        <FHIRExportButton token={token || ''} caseId={caseId} />
        <button
          onClick={handleCopySOAP}
          className="px-4 py-2 text-sm font-medium text-cream-50/70 border border-navy-600
                     rounded-lg hover:text-cream-50 hover:border-navy-500 transition-colors"
        >
          Copiar SOAP
        </button>
        <button
          onClick={() => caseData.soap_structured && handleSOAPSave(caseData.soap_structured)}
          disabled={saveStatus === 'saving'}
          className="px-4 py-2 text-sm font-medium bg-teal-400 text-navy-900 rounded-lg
                     hover:bg-teal-500 transition-colors disabled:opacity-50 ml-auto"
        >
          {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
