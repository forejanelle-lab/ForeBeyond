-- Fore Beyond: member support requests
-- Migration: 038_support_requests.sql

DO $$ BEGIN
  CREATE TYPE support_request_status AS ENUM ('open', 'resolved', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_full_name TEXT,
  user_email TEXT,
  message TEXT NOT NULL CHECK (char_length(trim(message)) >= 10),
  status support_request_status DEFAULT 'open' NOT NULL,
  admin_response TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_requests_user_id ON support_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_created ON support_requests(created_at DESC);

DROP TRIGGER IF EXISTS update_support_requests_updated_at ON support_requests;
CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON support_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create support requests" ON support_requests;
CREATE POLICY "Users can create support requests"
  ON support_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own support requests" ON support_requests;
CREATE POLICY "Users can view own support requests"
  ON support_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all support requests" ON support_requests;
CREATE POLICY "Admins can view all support requests"
  ON support_requests FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update support requests" ON support_requests;
CREATE POLICY "Admins can update support requests"
  ON support_requests FOR UPDATE
  USING (is_admin(auth.uid()));
