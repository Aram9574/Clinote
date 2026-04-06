'use client'

import { useState } from 'react'
import { exportCasePDF } from '@/lib/export'
import { Download } from 'lucide-react'

interface FHIRExportButtonProps {
  token: string
  caseId: string
}

export function FHIRExportButton({ token, caseId }: FHIRExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportCasePDF(token, caseId)
    } catch {
      // Silently fail — PDF export may not be implemented yet
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cream-50/70
                 border border-navy-600 rounded-lg hover:text-cream-50 hover:border-navy-500
                 transition-colors disabled:opacity-50"
    >
      <Download size={14} />
      {isExporting ? 'Exportando...' : 'Exportar PDF'}
    </button>
  )
}
