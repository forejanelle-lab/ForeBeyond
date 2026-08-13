-- Host Finder: lead discovery, pipeline, and analytics

-- Enums
DO $$ BEGIN
  CREATE TYPE host_signal_intent AS ENUM ('high', 'medium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE host_lead_priority AS ENUM ('high_priority', 'good_prospect', 'possible', 'low_priority');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE host_pipeline_status AS ENUM (
    'new',
    'researching',
    'contacted',
    'follow_up_due',
    'replied',
    'interested',
    'application_started',
    'verified',
    'signed_up',
    'not_interested',
    'do_not_contact'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE host_finder_host_type AS ENUM (
    'experienced_cultural_exchange_host',
    'homestay_host',
    'language_teacher',
    'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE host_search_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE host_lead_source_type AS ENUM (
    'web',
    'reddit',
    'facebook',
    'forum',
    'blog',
    'homestay',
    'exchange_program',
    'community',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Signal library
CREATE TABLE IF NOT EXISTS host_signal_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phrase TEXT NOT NULL,
  intent_level host_signal_intent NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT host_signal_library_phrase_unique UNIQUE (phrase)
);

CREATE INDEX IF NOT EXISTS idx_host_signal_library_intent
  ON host_signal_library (intent_level, active);

-- Search history
CREATE TABLE IF NOT EXISTS host_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  country TEXT NOT NULL,
  region TEXT,
  host_type host_finder_host_type NOT NULL DEFAULT 'experienced_cultural_exchange_host',
  leads_requested INT NOT NULL CHECK (leads_requested > 0 AND leads_requested <= 100),
  status host_search_status NOT NULL DEFAULT 'pending',
  leads_found INT NOT NULL DEFAULT 0,
  high_priority_count INT NOT NULL DEFAULT 0,
  provider_used TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_host_searches_created
  ON host_searches (created_at DESC);

-- Leads
CREATE TABLE IF NOT EXISTS host_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES host_searches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  country TEXT,
  region TEXT,
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  priority host_lead_priority NOT NULL DEFAULT 'low_priority',
  host_type host_finder_host_type,
  evidence_excerpt TEXT,
  why_good_fit JSONB NOT NULL DEFAULT '[]'::jsonb,
  host_experience TEXT,
  potential_concerns JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_approach TEXT,
  score_explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
  pipeline_status host_pipeline_status NOT NULL DEFAULT 'new',
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  dedup_key TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ,
  dismissed_reason TEXT,
  outreach_draft TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT host_leads_dedup_key_unique UNIQUE (dedup_key)
);

CREATE INDEX IF NOT EXISTS idx_host_leads_search
  ON host_leads (search_id);

CREATE INDEX IF NOT EXISTS idx_host_leads_pipeline
  ON host_leads (pipeline_status);

CREATE INDEX IF NOT EXISTS idx_host_leads_score
  ON host_leads (score DESC);

CREATE INDEX IF NOT EXISTS idx_host_leads_dismissed
  ON host_leads (dismissed_at);

-- Sources per lead (supports multiple sources merged into one lead)
CREATE TABLE IF NOT EXISTS host_lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES host_leads(id) ON DELETE CASCADE,
  source_type host_lead_source_type NOT NULL DEFAULT 'web',
  source_url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT host_lead_sources_url_unique UNIQUE (source_url)
);

CREATE INDEX IF NOT EXISTS idx_host_lead_sources_lead
  ON host_lead_sources (lead_id);

-- Score history
CREATE TABLE IF NOT EXISTS host_lead_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES host_leads(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  priority host_lead_priority NOT NULL,
  explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_host_lead_scores_lead
  ON host_lead_scores (lead_id, scored_at DESC);

-- Pipeline event audit trail
CREATE TABLE IF NOT EXISTS host_pipeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES host_leads(id) ON DELETE CASCADE,
  from_status host_pipeline_status,
  to_status host_pipeline_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_host_pipeline_events_lead
  ON host_pipeline_events (lead_id, created_at DESC);

-- Future scheduled discovery (V1: structure only, not activated)
CREATE TABLE IF NOT EXISTS host_discovery_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  host_type host_finder_host_type NOT NULL DEFAULT 'experienced_cultural_exchange_host',
  leads_per_run INT NOT NULL DEFAULT 20 CHECK (leads_per_run > 0 AND leads_per_run <= 100),
  cron_expression TEXT NOT NULL DEFAULT '0 8 * * *',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_host_signal_library_updated_at ON host_signal_library;
CREATE TRIGGER update_host_signal_library_updated_at
  BEFORE UPDATE ON host_signal_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_host_leads_updated_at ON host_leads;
CREATE TRIGGER update_host_leads_updated_at
  BEFORE UPDATE ON host_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_host_discovery_schedules_updated_at ON host_discovery_schedules;
CREATE TRIGGER update_host_discovery_schedules_updated_at
  BEFORE UPDATE ON host_discovery_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: admin-only access
ALTER TABLE host_signal_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_pipeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_discovery_schedules ENABLE ROW LEVEL SECURITY;

-- host_signal_library
DROP POLICY IF EXISTS "Admins manage host signal library" ON host_signal_library;
CREATE POLICY "Admins manage host signal library"
  ON host_signal_library FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_searches
DROP POLICY IF EXISTS "Admins manage host searches" ON host_searches;
CREATE POLICY "Admins manage host searches"
  ON host_searches FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_leads
DROP POLICY IF EXISTS "Admins manage host leads" ON host_leads;
CREATE POLICY "Admins manage host leads"
  ON host_leads FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_lead_sources
DROP POLICY IF EXISTS "Admins manage host lead sources" ON host_lead_sources;
CREATE POLICY "Admins manage host lead sources"
  ON host_lead_sources FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_lead_scores
DROP POLICY IF EXISTS "Admins manage host lead scores" ON host_lead_scores;
CREATE POLICY "Admins manage host lead scores"
  ON host_lead_scores FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_pipeline_events
DROP POLICY IF EXISTS "Admins manage host pipeline events" ON host_pipeline_events;
CREATE POLICY "Admins manage host pipeline events"
  ON host_pipeline_events FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- host_discovery_schedules
DROP POLICY IF EXISTS "Admins manage host discovery schedules" ON host_discovery_schedules;
CREATE POLICY "Admins manage host discovery schedules"
  ON host_discovery_schedules FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Seed default signal library
INSERT INTO host_signal_library (phrase, intent_level, category) VALUES
  ('I hosted an exchange student', 'high', 'hosting_experience'),
  ('we hosted an exchange student', 'high', 'hosting_experience'),
  ('we hosted', 'high', 'hosting_experience'),
  ('I''d host again', 'high', 'hosting_intent'),
  ('I would host again', 'high', 'hosting_intent'),
  ('we loved hosting', 'high', 'hosting_experience'),
  ('hosting exchange students', 'high', 'hosting_experience'),
  ('hosting international students', 'high', 'hosting_experience'),
  ('our exchange student', 'high', 'hosting_experience'),
  ('our host student', 'high', 'hosting_experience'),
  ('we still keep in touch', 'high', 'hosting_experience'),
  ('looking to host', 'high', 'hosting_intent'),
  ('interested in hosting', 'high', 'hosting_intent'),
  ('hosted international students', 'high', 'hosting_experience'),
  ('hosted international visitors', 'high', 'hosting_experience'),
  ('cultural exchange', 'medium', 'cultural'),
  ('homestay', 'medium', 'accommodation'),
  ('international students', 'medium', 'cultural'),
  ('international visitors', 'medium', 'cultural'),
  ('love meeting people from other countries', 'medium', 'cultural'),
  ('spare bedroom', 'medium', 'accommodation'),
  ('extra bedroom', 'medium', 'accommodation'),
  ('cultural immersion', 'medium', 'cultural'),
  ('study abroad', 'medium', 'cultural'),
  ('exchange student', 'medium', 'cultural')
ON CONFLICT (phrase) DO NOTHING;
