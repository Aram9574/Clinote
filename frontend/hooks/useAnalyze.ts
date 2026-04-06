'use client'

import { useState, useCallback, useRef } from 'react'
import { connectSSE } from '@/lib/sse'
import type { AnalysisState, NoteType, ClinicalEntities, SOAPNote, ClinicalAlert, ProcessingStage } from '@/types/clinical'

const INITIAL_STAGES: ProcessingStage[] = [
  { id: 'detect', label: 'Detectando tipo de nota...', done: false },
  { id: 'extract', label: 'Extrayendo entidades clínicas...', done: false },
  { id: 'interactions', label: 'Analizando interacciones...', done: false },
  { id: 'soap', label: 'Generando SOAP...', done: false },
  { id: 'evidence', label: 'Buscando evidencia...', done: false },
]

const STAGE_MAP: Record<string, string> = {
  'Detectando tipo de nota...': 'detect',
  'Extrayendo entidades clínicas...': 'extract',
  'Analizando interacciones...': 'interactions',
  'Generando FHIR...': 'soap',
  'Buscando evidencia...': 'evidence',
  'Guardando caso...': 'soap',
}

const initialState: AnalysisState = {
  stage: '',
  noteType: null,
  entities: null,
  soap: null,
  alerts: [],
  fhir: null,
  caseId: null,
  processingMs: null,
  isStreaming: false,
  isComplete: false,
  error: null,
}

export function useAnalyze(token: string) {
  const [state, setState] = useState<AnalysisState>(initialState)
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES)
  const connectionRef = useRef<ReturnType<typeof connectSSE> | null>(null)

  const markStageDone = useCallback((stageId: string) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, done: true } : s))
  }, [])

  const analyze = useCallback((noteText: string) => {
    connectionRef.current?.close()
    setState({ ...initialState, isStreaming: true })
    setStages(INITIAL_STAGES.map(s => ({ ...s, done: false })))

    connectionRef.current = connectSSE(
      '/api/v1/analyze',
      token,
      { note_text: noteText },
      (eventType, data) => {
        switch (eventType) {
          case 'status': {
            const d = data as { stage: string }
            setState(prev => ({ ...prev, stage: d.stage }))
            const stageId = STAGE_MAP[d.stage]
            if (stageId) markStageDone(stageId)
            break
          }
          case 'note_type': {
            const d = data as { note_type: NoteType }
            setState(prev => ({ ...prev, noteType: d.note_type }))
            markStageDone('detect')
            break
          }
          case 'entities': {
            setState(prev => ({ ...prev, entities: data as ClinicalEntities }))
            markStageDone('extract')
            break
          }
          case 'soap': {
            setState(prev => ({ ...prev, soap: data as SOAPNote }))
            markStageDone('soap')
            break
          }
          case 'alerts': {
            setState(prev => ({ ...prev, alerts: data as ClinicalAlert[] }))
            markStageDone('interactions')
            break
          }
          case 'fhir': {
            setState(prev => ({ ...prev, fhir: data as object }))
            break
          }
          case 'complete': {
            const d = data as { case_id: string; processing_ms: number }
            setState(prev => ({
              ...prev,
              caseId: d.case_id,
              processingMs: d.processing_ms,
              isStreaming: false,
              isComplete: true,
            }))
            setStages(prev => prev.map(s => ({ ...s, done: true })))
            break
          }
          case 'error': {
            const d = data as { message: string }
            setState(prev => ({
              ...prev,
              error: d.message,
              isStreaming: false,
            }))
            break
          }
        }
      },
      (err) => {
        setState(prev => ({
          ...prev,
          error: err.message,
          isStreaming: false,
        }))
      },
      () => {
        setState(prev => ({ ...prev, isStreaming: false }))
      }
    )
  }, [token, markStageDone])

  const reset = useCallback(() => {
    connectionRef.current?.close()
    setState(initialState)
    setStages(INITIAL_STAGES.map(s => ({ ...s, done: false })))
  }, [])

  return { state, stages, analyze, reset }
}
