-- Get to Know sessions and host conversation fields

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS conversation_topics TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_recommendations TEXT;

COMMENT ON COLUMN host_listings.conversation_topics IS
  'Host-provided topics they are happy to talk about with travelers.';
COMMENT ON COLUMN host_listings.local_recommendations IS
  'Host-written local recommendations travelers can use as conversation context.';

DROP VIEW IF EXISTS public_listings;
CREATE VIEW public_listings AS
SELECT
  hl.id,
  hl.host_id,
  hl.title,
  hl.family_story,
  hl.stay_details,
  hl.intro_video_url,
  hl.languages,
  hl.country,
  hl.city,
  hl.meals,
  hl.amenities,
  hl.family_activities,
  hl.house_rules,
  hl.household_members,
  hl.preferred_guest_gender,
  hl.conversation_topics,
  hl.local_recommendations,
  hl.budget_per_night,
  hl.budget_per_night_3_guests,
  hl.budget_per_night_4_guests,
  hl.budget_per_night_5_guests,
  hl.budget_per_night_6_plus_guests,
  hl.pricing_currency,
  hl.max_capacity,
  hl.published_at,
  hl.created_at,
  p.trust_score,
  p.trust_score_breakdown,
  p.profile_completion,
  p.verification_status,
  split_part(p.full_name, ' ', 1) AS host_first_name,
  NULLIF(trim(p.avatar_url), '') AS host_avatar_url,
  hp.host_motivation,
  hp.cultural_offerings,
  hp.household_description
FROM host_listings hl
JOIN profiles p ON p.id = hl.host_id
LEFT JOIN host_profiles hp ON hp.user_id = hl.host_id
WHERE hl.status = 'published';

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;

CREATE TABLE IF NOT EXISTS get_to_know_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES host_listings(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_prompt_id TEXT,
  interest_decision TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT get_to_know_sessions_answers_object CHECK (jsonb_typeof(answers) = 'object'),
  CONSTRAINT get_to_know_sessions_decision_check CHECK (
    interest_decision IS NULL
    OR interest_decision IN ('love_to_stay', 'learn_more', 'not_right_fit')
  ),
  CONSTRAINT get_to_know_sessions_traveler_listing UNIQUE (traveler_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_get_to_know_sessions_traveler
  ON get_to_know_sessions (traveler_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_get_to_know_sessions_listing
  ON get_to_know_sessions (listing_id);

COMMENT ON TABLE get_to_know_sessions IS
  'Private traveler Get to Know answers for a host listing. Interest decisions are traveler-only.';

DROP TRIGGER IF EXISTS update_get_to_know_sessions_updated_at ON get_to_know_sessions;
CREATE TRIGGER update_get_to_know_sessions_updated_at
  BEFORE UPDATE ON get_to_know_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE get_to_know_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Travelers can view their get to know sessions" ON get_to_know_sessions;
CREATE POLICY "Travelers can view their get to know sessions"
  ON get_to_know_sessions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = traveler_id);

DROP POLICY IF EXISTS "Travelers can insert their get to know sessions" ON get_to_know_sessions;
CREATE POLICY "Travelers can insert their get to know sessions"
  ON get_to_know_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = traveler_id);

DROP POLICY IF EXISTS "Travelers can update their get to know sessions" ON get_to_know_sessions;
CREATE POLICY "Travelers can update their get to know sessions"
  ON get_to_know_sessions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = traveler_id)
  WITH CHECK ((SELECT auth.uid()) = traveler_id);

DROP POLICY IF EXISTS "Travelers can delete their get to know sessions" ON get_to_know_sessions;
CREATE POLICY "Travelers can delete their get to know sessions"
  ON get_to_know_sessions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = traveler_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON get_to_know_sessions TO authenticated;
GRANT ALL ON TABLE get_to_know_sessions TO service_role;
