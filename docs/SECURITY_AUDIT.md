# CLINOTE — Security Audit Report

## Audit Summary

**Date:** April 2026
**Scope:** All backend routes, authentication, data handling
**Result:** No critical vulnerabilities identified in code review

---

## 1. Route Security

| Route | Auth Required | Notes |
|-------|-------------|-------|
| GET /health | No | Intentional — health check |
| POST /api/v1/analyze | JWT | Rate limited + monthly quota |
| GET /api/v1/cases | JWT | RLS enforced at DB level |
| GET /api/v1/cases/{id} | JWT | Ownership verified in code |
| PATCH /api/v1/cases/{id}/soap | JWT | Ownership verified |
| POST /api/v1/cases/{id}/alerts/{id}/acknowledge | JWT | Ownership verified |
| POST /api/v1/billing/checkout | JWT | price_id allowlist validated |
| POST /api/v1/billing/portal | JWT | Stripe customer verified |
| POST /api/v1/billing/webhook | No JWT | Stripe HMAC signature verified |

**Finding:** All routes properly authenticated. Webhook correctly uses Stripe signature.

---

## 2. Input Sanitization

- [x] Clinical note text sanitized for prompt injection patterns
- [x] Word count limits enforced (20-2000 words)
- [x] Pydantic models validate all request bodies
- [x] Max length constraints on all text fields
- [x] Note text is NOT stored in DB (only hash + extracted entities)

**Finding:** Input validation is comprehensive. Prompt injection risk is low.

---

## 3. API Keys & Secrets

- [x] No hardcoded secrets in any source file
- [x] All secrets via environment variables
- [x] .env.example contains only placeholder values
- [x] .gitignore should include .env files
- [x] Stripe secret key never exposed to frontend
- [x] Supabase service role key only used server-side

**Recommendation:** Add .env to .gitignore (create if not present).

---

## 4. CORS Configuration

```python
allow_origins=settings.allowed_origins  # From env var, default: ["http://localhost:3000"]
```

- [x] CORS origins from environment variable
- [x] Default restricts to localhost in development
- Warning: Production: Set ALLOWED_ORIGINS to exact frontend domain

**Recommendation:** Set `ALLOWED_ORIGINS=https://app.clinote.es` in production.

---

## 5. SQL Injection

- [x] All database access via Supabase Python client (parameterized queries)
- [x] No raw SQL string construction
- [x] RLS enforced at database level as second layer

**Finding:** No SQL injection vectors identified.

---

## 6. Data Exposure

- [x] Clinical note text not persisted (hash only)
- [x] FHIR bundle uses pseudonymized patient IDs (UUID generated)
- [x] No PII in logs (only user_id references)
- [x] Audit log IP addresses masked in display

---

## 7. Rate Limiting

- [x] Redis-backed rate limiting (slowapi)
- [x] Per-plan limits: free=2/min, pro=10/min, clinic=30/min
- [x] Monthly note quota enforced in DB
- [x] 429 response includes Retry-After header

---

## 8. Known Issues & Recommendations

### Medium Priority
1. **CORS wildcard in dev:** Development uses `http://localhost:3000` — acceptable for dev but confirm production override.
2. **Audit log IP:** `request.client.host` may be load balancer IP behind proxy. Consider `X-Forwarded-For` parsing.
3. **Evidence cache TTL:** 24h cache means potentially stale evidence. Consider shorter TTL or cache invalidation.

### Low Priority
4. **Password policy:** Supabase Auth handles passwords — ensure minimum length is configured in Supabase dashboard.
5. **MFA enforcement:** Consider making MFA mandatory for org_admin and platform_admin roles.
6. **PDF export:** Backend endpoint not implemented — frontend silently fails. Add proper 501 response.

---

## 9. Compliance Status

| Requirement | Status | Notes |
|------------|--------|-------|
| RGPD data minimization | Done | Raw note not stored |
| RGPD consent | Pending | Implement consent flow |
| TLS in transit | Done | Enforced by Railway/Vercel |
| Audit trail | Done | audit_log table |
| MFA support | Done | Supabase TOTP |
| Data deletion | Partial | Cases delete cascade, need user deletion flow |
| Data export | Pending | /api/v1/users/export not implemented |
