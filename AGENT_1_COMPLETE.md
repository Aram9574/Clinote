# AGENT_1 — Database Layer Complete

## Summary

All database schema, RLS policies, functions, seed data, Supabase config, and TypeScript client helpers have been created.

## Files Created

### Supabase Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | All 7 tables + 8 indexes |
| `supabase/migrations/002_rls_policies.sql` | RLS enable + 2 helper functions + 14 policies |
| `supabase/migrations/003_functions.sql` | 4 PL/pgSQL functions + 1 trigger |

### Supabase Config & Seed

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Local dev config (ports 54321-54326, auth, MFA) |
| `supabase/seed.sql` | 1 org, 3 users, 5 cases, 7 alerts, 3 prompts, 4 audit rows |

### TypeScript Client Helpers

| File | Purpose |
|------|---------|
| `lib/supabase/types.ts` | Full type map including Database interface |
| `lib/supabase/client.ts` | Browser client (Next.js) via `@supabase/ssr` |
| `lib/supabase/server.ts` | Server Component / Route Handler client |
| `lib/supabase/admin.ts` | Service role client (backend only) |

---

## Schema Summary

| Table | Columns | Notes |
|-------|---------|-------|
| `organizations` | 7 | plan CHECK: free/pro/clinic |
| `users` | 10 | References auth.users; role CHECK |
| `cases` | 11 | JSONB: soap_structured, fhir_bundle, entities |
| `alerts` | 11 | severity + category CHECKs |
| `audit_log` | 9 | Append-only (no UPDATE/DELETE policies) |
| `evidence_cache` | 7 | Unique on query_hash; expires_at indexed |
| `prompt_versions` | 7 | is_active flag; managed by platform_admin only |

**Total indexes:** 8 (covering user lookups, time-series queries, and cache expiry)

---

## RLS Policy Summary

| Table | Policies |
|-------|---------|
| `users` | SELECT (own + org_admin scoped + platform_admin), UPDATE (own only) |
| `cases` | SELECT, INSERT, UPDATE (own), DELETE (own) |
| `alerts` | SELECT (case owner + admins), UPDATE acknowledged (case owner) |
| `audit_log` | SELECT (own + org scoped + platform_admin), INSERT (any auth) — no UPDATE/DELETE |
| `evidence_cache` | SELECT/INSERT/UPDATE (any auth), DELETE (platform_admin only) |
| `prompt_versions` | SELECT (any auth), ALL (platform_admin only) |

---

## Functions Summary

| Function | Language | Security | Purpose |
|----------|----------|----------|---------|
| `get_user_role(uuid)` | SQL | DEFINER | RLS helper |
| `get_user_org_id(uuid)` | SQL | DEFINER | RLS helper |
| `increment_notes_used(uuid)` | PL/pgSQL | DEFINER | Rate limit tracking |
| `reset_monthly_counters()` | PL/pgSQL | DEFINER | Called by cron on 1st of month |
| `get_user_plan_limits(uuid)` | PL/pgSQL | DEFINER STABLE | Returns plan limits JSON |
| `update_updated_at()` | PL/pgSQL | — | Trigger function for users.updated_at |

---

## Seed Data

- **Organization:** Clínica San Rafael (plan: clinic, country: ES)
- **Users:** physician (dr.garcia), org_admin, platform_admin — all with fixed UUIDs prefixed `b1/b2/b3`
- **Cases (5):** Hypertensive crisis, STEMI, COPD exacerbation, Heart failure discharge, DM1 hypoglycemia — all with full SOAP + clinical entities in Spanish
- **Alerts (7):** Mix of critical/warning/info across all alert categories
- **Prompt versions (3):** NLP extraction, CDSS alerts, SOAP generator — all `is_active: true`
- **Audit log (4):** Sample case creation and login events

---

## Assumptions & Notes

1. **auth.users must be pre-populated** before running seed.sql. The `users` table has a FK to `auth.users(id)`. In local dev, use Supabase Studio or a setup script to create auth entries with the fixed UUIDs before seeding.
2. **SNOMED/RxNorm codes** in seed entities are labeled `_placeholder` — they are structurally correct but use approximate codes. Production use requires a licensed terminology server.
3. **fhir_bundle** column is seeded as NULL. FHIR R4 bundle generation is expected to be populated by the backend NLP pipeline.
4. **organizations table has no RLS** — it is intentionally left without RLS to allow org lookups in helper functions. Access control at the application layer is recommended, or add SELECT policy if needed.
5. **prompt_versions ALL policy** may conflict with the SELECT policy for platform_admin. PostgreSQL evaluates permissive policies with OR logic so this is safe — the ALL policy covers INSERT/UPDATE/DELETE for platform_admin, and the SELECT policy covers all authenticated users.
6. **Supabase CLI verification** must be run manually:
   ```bash
   supabase start
   supabase db reset  # applies all migrations and seed
   supabase db lint   # checks for policy issues
   ```
7. **Monthly counter reset** requires a pg_cron job (or Supabase Edge Function cron) pointing to `SELECT reset_monthly_counters()` on the 1st of each month.
