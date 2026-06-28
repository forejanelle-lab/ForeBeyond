-- Login audit trail and last-active tracking for members.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_login_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  auth_method TEXT NOT NULL DEFAULT 'password',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_login_events_user_logged_in
  ON user_login_events(user_id, logged_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_last_active
  ON profiles(last_active_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_profiles_last_login
  ON profiles(last_login_at DESC NULLS LAST);

CREATE OR REPLACE FUNCTION public.record_user_login(
  p_user_id UUID,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_auth_method TEXT DEFAULT 'password'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_ip INET;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Can only record login for the signed-in user';
  END IF;

  BEGIN
    v_ip := NULLIF(TRIM(p_ip), '')::INET;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;

  INSERT INTO user_login_events (user_id, ip_address, user_agent, auth_method)
  VALUES (
    p_user_id,
    v_ip,
    NULLIF(TRIM(p_user_agent), ''),
    COALESCE(NULLIF(TRIM(p_auth_method), ''), 'password')
  )
  RETURNING id INTO v_id;

  UPDATE profiles
  SET
    last_login_at = NOW(),
    last_active_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_user_activity(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Can only update activity for the signed-in user';
  END IF;

  UPDATE profiles
  SET last_active_at = NOW(), updated_at = NOW()
  WHERE id = p_user_id
    AND (
      last_active_at IS NULL
      OR last_active_at < NOW() - INTERVAL '5 minutes'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_user_login(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_user_activity(UUID) TO authenticated;

ALTER TABLE user_login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own login events" ON user_login_events;
CREATE POLICY "Users can view own login events"
  ON user_login_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all login events" ON user_login_events;
CREATE POLICY "Admins can view all login events"
  ON user_login_events FOR SELECT
  USING (public.is_admin(auth.uid()));
