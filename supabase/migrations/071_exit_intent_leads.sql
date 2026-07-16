-- Exit-intent community email captures

DO $$ BEGIN
  CREATE TYPE exit_intent_interest AS ENUM ('hosting', 'traveling', 'both');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS exit_intent_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  interest exit_intent_interest NOT NULL,
  tag TEXT NOT NULL DEFAULT 'Exit Intent Lead',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT exit_intent_leads_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_exit_intent_leads_created
  ON exit_intent_leads (created_at DESC);

DROP TRIGGER IF EXISTS update_exit_intent_leads_updated_at ON exit_intent_leads;
CREATE TRIGGER update_exit_intent_leads_updated_at
  BEFORE UPDATE ON exit_intent_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE exit_intent_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view exit intent leads" ON exit_intent_leads;
CREATE POLICY "Admins can view exit intent leads"
  ON exit_intent_leads FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update exit intent leads" ON exit_intent_leads;
CREATE POLICY "Admins can update exit intent leads"
  ON exit_intent_leads FOR UPDATE
  USING (is_admin(auth.uid()));
