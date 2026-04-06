export type UserRole = 'physician' | 'org_admin' | 'platform_admin'
export type OrgPlan = 'free' | 'pro' | 'clinic'
export type NoteType = 'ambulatory' | 'emergency' | 'discharge' | 'unknown'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertCategory =
  | 'drug_interaction'
  | 'critical_value'
  | 'differential_diagnosis'
  | 'drug_disease_interaction'
  | 'monitoring_gap'
  | 'guideline_deviation'

export interface Diagnosis {
  display: string
  snomed_placeholder: string | null
  confidence: number
  negated: boolean
  temporal: 'current' | 'historical' | 'family'
}

export interface Medication {
  name: string
  dose: string | null
  frequency: string | null
  route: string | null
  status: string | null
  rxnorm_placeholder: string | null
}

export interface Vital {
  type: string
  value: string
  unit: string | null
  timestamp_mentioned: string | null
}

export interface LabValue {
  name: string
  value: string
  unit: string | null
  reference_range: string | null
  flag: 'normal' | 'high' | 'low' | 'critical' | null
}

export interface Allergy {
  substance: string
  reaction: string | null
  severity: string | null
}

export interface Procedure {
  name: string
  date_mentioned: string | null
  status: string | null
}

export interface ClinicalEntities {
  diagnoses: Diagnosis[]
  medications: Medication[]
  procedures: Procedure[]
  vitals: Vital[]
  allergies: Allergy[]
  lab_values: LabValue[]
  chief_complaint: string | null
  physical_exam: Record<string, string>
}

export interface SOAPNote {
  S: string
  O: string
  A: string
  P: string
}

export interface ClinicalAlert {
  id?: string
  case_id?: string
  severity: AlertSeverity
  category: AlertCategory
  message: string
  detail: string | null
  source: string | null
  acknowledged?: boolean
  acknowledged_at?: string | null
  created_at?: string
}

export interface CaseData {
  id: string
  user_id: string
  note_type: NoteType
  word_count: number | null
  processing_ms: number | null
  model_version: string | null
  soap_structured: SOAPNote | null
  entities: ClinicalEntities | null
  fhir_bundle: object | null
  alerts: ClinicalAlert[]
  created_at: string
}

export interface EvidenceItem {
  title: string
  source: string
  pmid?: string
  year?: string
  summary?: string | null
  url?: string
}

export interface AnalysisState {
  stage: string
  noteType: NoteType | null
  entities: ClinicalEntities | null
  soap: SOAPNote | null
  alerts: ClinicalAlert[]
  fhir: object | null
  caseId: string | null
  processingMs: number | null
  isStreaming: boolean
  isComplete: boolean
  error: string | null
}

export interface ProcessingStage {
  id: string
  label: string
  done: boolean
}
