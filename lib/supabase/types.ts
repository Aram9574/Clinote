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
export type EvidenceSource = 'pubmed' | 'cochrane'

export interface Organization {
  id: string
  name: string
  tax_id: string | null
  country: string
  plan: OrgPlan
  stripe_customer_id: string | null
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  org_id: string | null
  mfa_enabled: boolean
  notes_used_this_month: number
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  user_id: string
  input_hash: string
  note_type: NoteType
  word_count: number | null
  processing_ms: number | null
  model_version: string | null
  soap_structured: SOAPStructured | null
  fhir_bundle: object | null
  entities: ClinicalEntities | null
  created_at: string
}

export interface Alert {
  id: string
  case_id: string
  severity: AlertSeverity
  category: AlertCategory
  message: string
  detail: string | null
  source: string | null
  acknowledged: boolean
  acknowledged_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: object | null
  created_at: string
}

export interface EvidenceCache {
  id: string
  query_hash: string
  source: EvidenceSource | null
  results: object
  fetched_at: string
  expires_at: string
}

export interface PromptVersion {
  id: string
  name: string
  version: string
  content: string
  is_active: boolean
  created_at: string
}

// Clinical entity types
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

export interface Procedure {
  name: string
  date_mentioned: string | null
  status: string | null
}

export interface Vital {
  type: string
  value: string
  unit: string | null
  timestamp_mentioned: string | null
}

export interface Allergy {
  substance: string
  reaction: string | null
  severity: string | null
}

export interface LabValue {
  name: string
  value: string
  unit: string | null
  reference_range: string | null
  flag: 'normal' | 'high' | 'low' | 'critical' | null
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

export interface SOAPStructured {
  S: string
  O: string
  A: string
  P: string
}

export interface UserPlanLimits {
  plan: OrgPlan
  notes_used_this_month: number
  monthly_limit: number
  requests_per_minute: number
  can_process: boolean
}

// Database type map for Supabase client
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      cases: {
        Row: Case
        Insert: Omit<Case, 'id' | 'created_at'>
        Update: Partial<Omit<Case, 'id' | 'created_at' | 'user_id'>>
      }
      alerts: {
        Row: Alert
        Insert: Omit<Alert, 'id' | 'created_at'>
        Update: Partial<Pick<Alert, 'acknowledged' | 'acknowledged_at'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
      evidence_cache: {
        Row: EvidenceCache
        Insert: Omit<EvidenceCache, 'id' | 'fetched_at'>
        Update: Partial<Omit<EvidenceCache, 'id' | 'query_hash'>>
      }
      prompt_versions: {
        Row: PromptVersion
        Insert: Omit<PromptVersion, 'id' | 'created_at'>
        Update: Partial<Omit<PromptVersion, 'id' | 'created_at'>>
      }
    }
    Functions: {
      increment_notes_used: {
        Args: { p_user_id: string }
        Returns: void
      }
      reset_monthly_counters: {
        Args: Record<never, never>
        Returns: void
      }
      get_user_plan_limits: {
        Args: { p_user_id: string }
        Returns: UserPlanLimits
      }
    }
  }
}
