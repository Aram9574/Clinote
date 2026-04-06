'use client'

import { useState } from 'react'
import { SOAPEditor } from './SOAPEditor'
import { EntityTags } from './EntityTags'
import { EvidencePanel } from './EvidencePanel'
import type { CaseData, SOAPNote } from '@/types/clinical'

interface SOAPViewerProps {
  caseData: CaseData
  token: string
  caseId: string
  onSave: (soap: SOAPNote) => void
}

type TabId = 'soap' | 'entities' | 'fhir' | 'evidence'

const TABS = [
  { id: 'soap' as TabId, label: 'SOAP' },
  { id: 'entities' as TabId, label: 'Entidades' },
  { id: 'fhir' as TabId, label: 'FHIR' },
  { id: 'evidence' as TabId, label: 'Evidencia' },
]

export function SOAPViewer({ caseData, token, caseId, onSave }: SOAPViewerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('soap')
  const [editedSoap, setEditedSoap] = useState<SOAPNote>(
    caseData.soap_structured || { S: '', O: '', A: '', P: '' }
  )

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-navy-600 px-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-cream-50/50 hover:text-cream-50/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {activeTab === 'soap' && (
          <SOAPEditor soap={editedSoap} onChange={setEditedSoap} onSave={onSave} />
        )}
        {activeTab === 'entities' && caseData.entities && (
          <EntityTags entities={caseData.entities} />
        )}
        {activeTab === 'fhir' && (
          <pre className="font-mono text-xs text-cream-50/70 bg-navy-800 rounded-lg p-4 overflow-auto max-h-[600px] whitespace-pre-wrap">
            {JSON.stringify(caseData.fhir_bundle, null, 2)}
          </pre>
        )}
        {activeTab === 'evidence' && (
          <EvidencePanel token={token} caseId={caseId} />
        )}
      </div>
    </div>
  )
}
