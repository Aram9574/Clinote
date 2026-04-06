# AGENT_2 Complete — FastAPI Backend

## Files Created

### Root
- `backend/requirements.txt` — Python dependencies (FastAPI, Anthropic, Supabase, Redis, SlowAPI, etc.)
- `backend/.env.example` — Environment variable template (no real secrets)
- `backend/Dockerfile` — Multi-stage Docker build with non-root user
- `backend/docker-compose.yml` — Local dev compose with Redis

### app/
- `app/__init__.py`
- `app/main.py` — FastAPI app factory: CORS, AuditMiddleware, rate limiter, router registration
- `app/config.py` — Pydantic Settings with lru_cache, loads from .env

### app/models/
- `models/__init__.py`
- `models/request.py` — AnalyzeRequest (word count validation), UpdateSOAPRequest, AcknowledgeAlertRequest
- `models/response.py` — Full response models: CaseResponse, AlertResponse, ClinicalEntitiesResponse, SOAPResponse, etc.
- `models/internal.py` — Internal data models: ParsedEntities, SOAPNote, ClinicalAlert, NLPResult

### app/services/
- `services/__init__.py`
- `services/nlp_core.py` — Streaming + sync Claude extraction; yields SSE-compatible events; handles markdown JSON cleanup
- `services/cdss_engine.py` — Three CDSS modules: (1) critical value rules engine with 35+ lab thresholds, (2) RxNorm interaction checker wrapper, (3) contextual LLM CDSS; deduplication + sort by severity; capped at 10 alerts
- `services/fhir_mapper.py` — Maps entities to FHIR R4 Bundle (Composition, Patient, Condition, MedicationStatement, Observation, AllergyIntolerance, Procedure)
- `services/evidence_layer.py` — PubMed + Cochrane search with 24h Supabase cache; graceful degradation
- `services/interaction_checker.py` — RxNorm API: resolves drug names to RxCUI, checks interaction list, returns high/moderate alerts
- `services/audit_service.py` — Fire-and-forget audit log to Supabase `audit_log` table

### app/routers/
- `routers/__init__.py`
- `routers/health.py` — GET /health endpoint
- `routers/analyze.py` — POST /api/v1/analyze → SSE stream; creates case, runs NLP+CDSS+FHIR, saves to Supabase, background evidence fetch
- `routers/cases.py` — GET /cases, GET /cases/{id}, PATCH /cases/{id}/soap, POST /cases/{id}/alerts/{id}/acknowledge, GET /cases/{id}/evidence
- `routers/auth.py` — POST /auth/login (Supabase), POST /auth/logout

### app/middleware/
- `middleware/__init__.py`
- `middleware/auth.py` — JWT validation via Supabase; get_current_user and get_current_user_with_profile with full profile fetch
- `middleware/rate_limiter.py` — SlowAPI limiter backed by Redis; plan-aware upgrade messages; 429 handler
- `middleware/audit_middleware.py` — Injects X-Request-ID header; records start time on request.state

### app/utils/
- `utils/__init__.py`
- `utils/crypto.py` — SHA-256 note hashing for deduplication
- `utils/validators.py` — Word count validation; prompt injection sanitization

### prompts/
- `prompts/__init__.py`
- `prompts/nlp_extraction.py` — Full Spanish clinical NLP system prompt with SOAP generation instructions and abbreviation dictionary
- `prompts/cdss_contextual.py` — CDSS system prompt with strict rules (max 3 alerts, no diagnosis/prescription)

### tests/
- `tests/__init__.py`
- `tests/conftest.py` — pytest fixtures: event_loop, mock_anthropic_client, sample_entities_cardiology, sample_entities_polypharmacy
- `tests/test_cdss_engine.py` — 10 unit tests for critical value detection (K, Na, Hb, BNP, Troponin, pH)
- `tests/test_fhir_mapper.py` — 8 tests for FHIR bundle structure, negation, temporal status, resource counts
- `tests/test_interactions.py` — Interaction detection (mocked RxNorm), deduplication, sorting, cap-at-10
- `tests/test_nlp_core.py` — NLP streaming structure, negation handling (mocked Anthropic)
- `tests/fixtures/__init__.py`
- `tests/fixtures/clinical_notes_es.py` — 5 realistic Spanish clinical notes (cardiology, diabetes, COPD, post-surgical, polypharmacy)

## Service Architecture Summary

| Service | Description |
|---|---|
| nlp_core | Claude claude-sonnet-4-20250514 streaming extraction → entities + SOAP in one call |
| cdss_engine | Rules (critical values) + RxNorm API (interactions) + LLM contextual — run in parallel |
| fhir_mapper | Pure function, no I/O — entities dict → FHIR R4 Bundle |
| evidence_layer | PubMed esearch/efetch + Cochrane API, 24h cache in Supabase |
| interaction_checker | RxNorm rxcui.json + interaction/list.json — graceful degradation |
| audit_service | Fire-and-forget, never raises exceptions |

## Assumptions and Notes

1. **Supabase RPC functions assumed**: `increment_notes_used(p_user_id)` and `get_user_plan_limits(p_user_id)` must exist in Supabase (created by AGENT_1 or database migrations).
2. **PYTHONPATH=/app** must be set so `from prompts.xxx import` resolves correctly — handled in Dockerfile and should be set locally when running tests.
3. **Tests require mocked Anthropic client** — all test files mock `anthropic.AsyncAnthropic` so no real API key is needed to run the test suite.
4. **Redis required at startup** — the rate limiter connects to Redis on import via `get_settings()`. In test environments, either mock or provide a Redis URL.
5. **FHIR**: Using R4 profile. SNOMED/RxNorm codes are best-effort from LLM — labeled as placeholders in the schema.
6. **Streaming**: The `/analyze` endpoint returns `text/event-stream` via `sse-starlette`. Frontend must consume SSE events by name (`status`, `note_type`, `entities`, `soap`, `alerts`, `fhir`, `complete`, `error`).
7. **Critical value thresholds**: Based on standard Spanish clinical practice guidelines. Values flagged include K, Na, Hb, INR, pH, pO2, pCO2, Troponin, BNP, Procalcitonin, Lactate, and 20+ others.
