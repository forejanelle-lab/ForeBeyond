-- OAuth-connected social platform accounts (Instagram v1)

CREATE TABLE IF NOT EXISTS social_platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform social_platform NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT NOT NULL,
  account_username TEXT,
  account_name TEXT,
  page_id TEXT,
  page_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  connected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform)
);

CREATE INDEX IF NOT EXISTS idx_social_platform_connections_platform
  ON social_platform_connections (platform);

DROP TRIGGER IF EXISTS update_social_platform_connections_updated_at ON social_platform_connections;
CREATE TRIGGER update_social_platform_connections_updated_at
  BEFORE UPDATE ON social_platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE social_platform_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view social platform connections" ON social_platform_connections;
CREATE POLICY "Admins can view social platform connections"
  ON social_platform_connections FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert social platform connections" ON social_platform_connections;
CREATE POLICY "Admins can insert social platform connections"
  ON social_platform_connections FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update social platform connections" ON social_platform_connections;
CREATE POLICY "Admins can update social platform connections"
  ON social_platform_connections FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete social platform connections" ON social_platform_connections;
CREATE POLICY "Admins can delete social platform connections"
  ON social_platform_connections FOR DELETE
  USING (is_admin(auth.uid()));

NOTIFY pgrst, 'reload schema';
