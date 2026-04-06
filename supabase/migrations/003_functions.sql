-- ============================================================
-- CLINOTE — Database Functions & Triggers
-- Migration: 003_functions.sql
-- ============================================================

-- Increment notes used this month for a user
CREATE OR REPLACE FUNCTION increment_notes_used(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET notes_used_this_month = notes_used_this_month + 1,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset all monthly counters (called by cron on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET notes_used_this_month = 0,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get rate limits by user plan
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_plan text;
  v_notes_used integer;
BEGIN
  SELECT o.plan, u.notes_used_this_month
  INTO v_plan, v_notes_used
  FROM users u
  LEFT JOIN organizations o ON u.org_id = o.id
  WHERE u.id = p_user_id;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  RETURN jsonb_build_object(
    'plan', v_plan,
    'notes_used_this_month', COALESCE(v_notes_used, 0),
    'monthly_limit', CASE v_plan
      WHEN 'free' THEN 10
      WHEN 'pro' THEN -1
      WHEN 'clinic' THEN -1
      ELSE 10
    END,
    'requests_per_minute', CASE v_plan
      WHEN 'free' THEN 2
      WHEN 'pro' THEN 10
      WHEN 'clinic' THEN 30
      ELSE 2
    END,
    'can_process', CASE v_plan
      WHEN 'free' THEN COALESCE(v_notes_used, 0) < 10
      ELSE true
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
