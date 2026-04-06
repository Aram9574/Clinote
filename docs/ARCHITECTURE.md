# CLINOTE — Architecture Documentation

## System Overview

CLINOTE is a clinical NLP SaaS that processes free-text clinical notes in Spanish and produces:
- Structured SOAP notes
- Clinical entity extraction (diagnoses, medications, vitals, labs, allergies, procedures)
- Clinical decision support alerts (drug interactions, critical values, contextual LLM)
- FHIR R4 bundles
- Asynchronous evidence from PubMed and Cochrane

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | Web UI |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| Backend | FastAPI (Python 3.11) | API + business logic |
| Database | Supabase (PostgreSQL + RLS) | Data persistence |
| Auth | Supabase Auth + TOTP MFA | Authentication |
| Cache | Redis (Upstash) | Rate limiting + evidence cache |
| LLM | Anthropic Claude claude-sonnet-4 | NLP + CDSS |
| Drug DB | RxNorm API (NIH) | Drug interactions |
| Evidence | PubMed + Cochrane | Scientific evidence |
| Payments | Stripe | Subscription billing |
| Deploy FE | Vercel | Frontend hosting |
| Deploy BE | Railway | Backend hosting |

## Data Flow: Note Analysis

```
User submits note
        │
        ▼
FastAPI /api/v1/analyze (POST)
        │
        ├─── Input validation (20-2000 words)
        ├─── Prompt injection sanitization
        ├─── Rate limit check (Redis + DB counter)
        ├─── Create case record (Supabase)
        │
        ▼
SSE Stream begins ──────────────────────────────────────────┐
        │                                                    │
        ▼                                                    │
Claude API (streaming)                                       │
  - Detect note type                                         │
  - Extract entities (diagnoses, meds, vitals, labs...)     │
  - Build SOAP (S, O, A, P)                                  │
  - Yield partial results as SSE events                      │
        │                                                    │
        ▼                                                    │
CDSS Engine (parallel)                                       │
  ├─ Module 1: RxNorm Interaction Check                      │
  ├─ Module 2: Critical Value Rules (35+ thresholds)         │
  └─ Module 3: Contextual LLM (if 2+ dx or 3+ meds)         │
        │                                                    │
        ▼                                                    │
Alert Aggregation                                            │
  - Deduplicate                                              │
  - Sort: critical > warning > info                          │
  - Cap at 10 alerts                                         │
        │                                                    │
        ▼                                                    │
FHIR R4 Mapper                                               │
  - Bundle type: "document"                                  │
  - Resources: Composition, Patient, Condition,              │
    MedicationStatement, Observation, AllergyIntolerance,    │
    Procedure                                                │
        │                                                    │
        ▼                                                    │
Save to Supabase ◄───────────────────────────────────────────┘
  - cases table
  - alerts table
  - Increment notes_used_this_month
        │
        ▼ (BackgroundTask)
Evidence Layer
  - Build PubMed query from top diagnoses + meds
  - Search PubMed (esearch + efetch, last 2 years, top 5)
  - Search Cochrane (REST API)
  - Cache results (24h TTL)
  - Update case with evidence
```

## Database Schema

```
organizations
├── id (uuid PK)
├── name, tax_id, country
├── plan (free|pro|clinic)
├── stripe_customer_id
└── created_at

users (extends auth.users)
├── id (uuid FK → auth.users)
├── email, full_name
├── role (physician|org_admin|platform_admin)
├── org_id (FK → organizations)
├── mfa_enabled, notes_used_this_month
└── created_at, updated_at

cases
├── id (uuid PK)
├── user_id (FK → users)
├── input_hash (SHA-256 of note)
├── note_type (ambulatory|emergency|discharge|unknown)
├── word_count, processing_ms, model_version
├── soap_structured (jsonb)
├── fhir_bundle (jsonb)
├── entities (jsonb)
└── created_at

alerts
├── id (uuid PK)
├── case_id (FK → cases)
├── severity (critical|warning|info)
├── category (drug_interaction|critical_value|...)
├── message, detail, source
├── acknowledged, acknowledged_at
└── created_at

audit_log
├── id, user_id, action
├── resource_type, resource_id
├── ip_address, user_agent
├── metadata (jsonb)
└── created_at

evidence_cache
├── id, query_hash (unique)
├── source (pubmed|cochrane)
├── results (jsonb)
├── fetched_at, expires_at
└── [TTL: 24 hours]

prompt_versions
└── NLP and CDSS prompt versioning
```

## Security Model

### Authentication
- Supabase Auth manages JWTs
- TOTP MFA available (Supabase built-in)
- All API endpoints except /health require valid JWT Bearer token
- Stripe webhook uses HMAC signature verification (no JWT)

### Authorization (Row Level Security)
- PostgreSQL RLS enforced at DB level
- Three roles: physician (own data), org_admin (org data), platform_admin (all)
- audit_log: INSERT only, no UPDATE/DELETE for any role

### Input Security
- Word count validation (20-2000 words)
- Prompt injection sanitizer (regex patterns)
- All text inputs have max_length constraints
- CORS restricted to known origins in production

### Data Security
- No raw clinical note text stored (only hash + extracted entities)
- Service role key never exposed to frontend
- All secrets via environment variables
- Secrets referenced by name in deployment configs

## API Contract

### POST /api/v1/analyze
**Auth:** Bearer JWT
**Content-Type:** application/json
**Body:** `{"note_text": "string (20-2000 words)"}`
**Response:** text/event-stream (SSE)

SSE Event types:
- `status` → `{"stage": "string"}`
- `note_type` → `{"note_type": "ambulatory|emergency|discharge|unknown"}`
- `entities` → `{diagnoses, medications, procedures, vitals, allergies, lab_values, chief_complaint, physical_exam}`
- `soap` → `{"S": "", "O": "", "A": "", "P": ""}`
- `alerts` → `[{severity, category, message, detail, source}]`
- `fhir` → FHIR R4 Bundle object
- `complete` → `{"case_id": "uuid", "processing_ms": number}`
- `error` → `{"message": "string"}`

### GET /api/v1/cases
**Auth:** Bearer JWT
**Query:** `page=1&per_page=20`
**Response:** `{"cases": [...], "page": 1, "per_page": 20}`

### GET /api/v1/cases/{id}
**Auth:** Bearer JWT
**Response:** Full case object with alerts array

### PATCH /api/v1/cases/{id}/soap
**Auth:** Bearer JWT
**Body:** `{"S"?: "", "O"?: "", "A"?: "", "P"?: ""}`
**Response:** `{"success": true, "soap_structured": {...}}`

### POST /api/v1/cases/{id}/alerts/{alert_id}/acknowledge
**Auth:** Bearer JWT
**Response:** `{"success": true, "acknowledged": true}`

### POST /api/v1/billing/checkout
**Auth:** Bearer JWT
**Body:** `{"price_id": "price_xxx"}`
**Response:** `{"checkout_url": "https://checkout.stripe.com/..."}`

### POST /api/v1/billing/webhook
**Auth:** Stripe HMAC signature (header: stripe-signature)
**Response:** `{"received": true}`

### GET /health
**Auth:** None
**Response:** `{"status": "healthy", "timestamp": "...", "service": "clinote-backend"}`

## Deployment Architecture

```
                    ┌──────────────────┐
                    │   GitHub Actions  │
                    │   CI: test+build  │
                    │   CD: auto deploy │
                    └────────┬─────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
    ┌──────────▼──────────┐    ┌───────────▼───────────┐
    │   Vercel             │    │   Railway              │
    │   (Frontend)         │    │   (Backend)            │
    │   Next.js 15         │    │   FastAPI              │
    │   Edge Network       │    │   2 uvicorn workers    │
    └──────────────────────┘    └───────────────────────┘
                                           │
                               ┌───────────┴───────────┐
                               │                       │
                    ┌──────────▼──────┐   ┌────────────▼─────┐
                    │   Supabase      │   │   Upstash Redis   │
                    │   PostgreSQL    │   │   (serverless)    │
                    │   + Auth        │   │   Rate limiting   │
                    │   + RLS         │   └──────────────────┘
                    └─────────────────┘
```

## Known Limitations

1. **Evidence quality:** PubMed efetch returns basic metadata; full abstracts require additional API calls
2. **SNOMED codes:** Extracted diagnoses use placeholder SNOMED codes (no live SNOMED lookup)
3. **RxNorm matching:** Drug name normalization depends on RxNorm's coverage of Spanish brand names
4. **Streaming in serverless:** SSE streaming requires keeping HTTP connections alive; Vercel's function timeout may limit stream duration
5. **Concurrent CDSS:** The contextual LLM CDSS module adds latency (~1-2s) when triggered
6. **PDF export:** The PDF export endpoint is defined in the frontend but the backend route is not implemented (placeholder)
7. **MFA enforcement:** MFA is available but not mandatory for all users (can be enforced at org level)

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Time to first SSE byte | < 1s | After auth |
| NLP completion (p50) | < 5s | Depends on Claude API |
| NLP completion (p95) | < 10s | Includes CDSS |
| Evidence fetch | < 10s | Background task |
| DB query latency | < 50ms | With indexes |
