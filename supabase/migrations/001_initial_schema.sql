-- ============================================================
-- CLINOTE — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- organizations (must come first, users references it)
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  country text DEFAULT 'ES',
  plan text CHECK (plan IN ('free','pro','clinic')) DEFAULT 'free',
  stripe_customer_id text,
  created_at timestamptz DEFAULT now()
);

-- users (extends Supabase auth.users)
CREATE TABLE users (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role text CHECK (role IN ('physician','org_admin','platform_admin')) DEFAULT 'physician',
  org_id uuid REFERENCES organizations(id),
  mfa_enabled boolean DEFAULT false,
  notes_used_this_month integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- cases
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  note_type text CHECK (note_type IN ('ambulatory','emergency','discharge','unknown')) DEFAULT 'unknown',
  word_count integer,
  processing_ms integer,
  model_version text,
  soap_structured jsonb,
  fhir_bundle jsonb,
  entities jsonb,
  created_at timestamptz DEFAULT now()
);

-- alerts
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  severity text CHECK (severity IN ('critical','warning','info')),
  category text CHECK (category IN ('drug_interaction','critical_value','differential_diagnosis','drug_disease_interaction','monitoring_gap','guideline_deviation')),
  message text NOT NULL,
  detail text,
  source text,
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- audit_log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- evidence_cache
CREATE TABLE evidence_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text NOT NULL UNIQUE,
  source text CHECK (source IN ('pubmed','cochrane')),
  results jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- prompt_versions
CREATE TABLE prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_alerts_case_id ON alerts(case_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_evidence_cache_query_hash ON evidence_cache(query_hash);
CREATE INDEX idx_evidence_cache_expires_at ON evidence_cache(expires_at);
