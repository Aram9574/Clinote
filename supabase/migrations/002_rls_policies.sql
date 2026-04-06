-- ============================================================
-- CLINOTE — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user org_id
CREATE OR REPLACE FUNCTION get_user_org_id(user_id uuid)
RETURNS uuid AS $$
  SELECT org_id FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS RLS
-- ============================================================

CREATE POLICY "users_select_own" ON users FOR SELECT
  USING (
    id = auth.uid()
    OR get_user_role(auth.uid()) = 'org_admin' AND org_id = get_user_org_id(auth.uid())
    OR get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- CASES RLS
-- ============================================================

CREATE POLICY "cases_select" ON cases FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'org_admin' AND user_id IN (
      SELECT id FROM users WHERE org_id = get_user_org_id(auth.uid())
    )
    OR get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "cases_insert" ON cases FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "cases_update_own" ON cases FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cases_delete_own" ON cases FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- ALERTS RLS
-- ============================================================

CREATE POLICY "alerts_select" ON alerts FOR SELECT
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'org_admin'
    OR get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "alerts_update_acknowledged" ON alerts FOR UPDATE
  USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  )
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
  );

-- ============================================================
-- AUDIT_LOG RLS
-- ============================================================

CREATE POLICY "audit_log_select" ON audit_log FOR SELECT
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'org_admin' AND user_id IN (
      SELECT id FROM users WHERE org_id = get_user_org_id(auth.uid())
    )
    OR get_user_role(auth.uid()) = 'platform_admin'
  );

CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE on audit_log for any role

-- ============================================================
-- EVIDENCE_CACHE RLS
-- ============================================================

CREATE POLICY "evidence_cache_select" ON evidence_cache FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "evidence_cache_insert" ON evidence_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "evidence_cache_update" ON evidence_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "evidence_cache_delete" ON evidence_cache FOR DELETE
  USING (get_user_role(auth.uid()) = 'platform_admin');

-- ============================================================
-- PROMPT_VERSIONS RLS (read-only for all authenticated)
-- ============================================================

CREATE POLICY "prompt_versions_select" ON prompt_versions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "prompt_versions_manage" ON prompt_versions FOR ALL
  USING (get_user_role(auth.uid()) = 'platform_admin');
