'use client'

import { useState, useEffect } from 'react'
import { fetchCase } from '@/lib/api'
import type { CaseData } from '@/types/clinical'

export function useCase(token: string, caseId: string | null) {
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!caseId || !token) return

    setIsLoading(true)
    setError(null)

    fetchCase(token, caseId)
      .then(data => {
        setCaseData(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [token, caseId])

  return { caseData, setCaseData, isLoading, error }
}
