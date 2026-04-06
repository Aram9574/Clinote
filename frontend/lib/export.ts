import { SOAPNote } from '@/types/clinical'
import { API_BASE } from './api'

export function formatSOAPAsText(soap: SOAPNote, caseId?: string): string {
  const separator = '═══════════════════════════════════'
  const lines = [
    `NOTA CLÍNICA ESTRUCTURADA${caseId ? ` [ID: ${caseId}]` : ''}`,
    `Generado por CLINOTE | ${new Date().toLocaleDateString('es-ES')}`,
    '',
  ]
  for (const [key, value] of Object.entries(soap)) {
    if (value) {
      lines.push(separator, key.toUpperCase(), separator, value, '')
    }
  }
  lines.push(
    '---',
    'AVISO LEGAL: Este documento ha sido generado con apoyo de IA. Su contenido',
    'es responsabilidad exclusiva del médico que lo revisa y suscribe.',
    'CLINOTE no constituye un dispositivo médico.',
  )
  return lines.join('\n')
}

export async function copySOAPToClipboard(soap: SOAPNote, caseId?: string): Promise<void> {
  const text = formatSOAPAsText(soap, caseId)
  await navigator.clipboard.writeText(text)
}

export async function exportCasePDF(token: string, caseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/export/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error('Error al generar PDF')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clinote-caso-${caseId.slice(0, 8)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
