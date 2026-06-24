-- Fore Beyond Phase 2 — Trust Score & Privacy
-- Run in Supabase SQL Editor after setup.sql


-- Fore Beyond Phase 2: Trust Score, Privacy, Stay Requests
-- Migration: 004_phase2_trust_privacy

-- New enums
DO $$ BEGIN
  CREATE TYPE stay_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE data_request_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend document_type enum
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'phone_verification';
ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'video_verification';

-- Extend badge_type enum
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'phone_verified';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'video_verified';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'address_verified';
ALTER TYPE badge_type ADD VALUE IF NOT EXISTS 'trusted_member';

-- Profile trust & verification columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS trust_score_breakdown JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS video_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address_verified_at TIMESTAMPTZ;

-- Stay requests (gates PII access until approved)
CREATE TABLE IF NOT EXISTS stay_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status stay_request_status DEFAULT 'pending' NOT NULL,
  message TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (traveler_id != host_id)
);

-- Completed trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_request_id UUID REFERENCES stay_requests(id) ON DELETE SET NULL,
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'completed' NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_positive BOOLEAN GENERATED ALWAYS AS (rating >= 4) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (reviewer_id != reviewee_id)
);

-- Privacy settings
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  profile_visible BOOLEAN DEFAULT TRUE,
  show_location BOOLEAN DEFAULT TRUE,
  show_bio BOOLEAN DEFAULT TRUE,
  analytics_cookies BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  functional_cookies BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cookie consents (anonymous or authenticated)
CREATE TABLE IF NOT EXISTS cookie_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  essential BOOLEAN DEFAULT TRUE,
  analytics BOOLEAN DEFAULT FALSE,
  marketing BOOLEAN DEFAULT FALSE,
  consented_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status data_request_status DEFAULT 'pending' NOT NULL,
  download_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Account deletion requests
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status data_request_status DEFAULT 'pending' NOT NULL,
  reason TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stay_requests_traveler ON stay_requests(traveler_id);
CREATE INDEX IF NOT EXISTS idx_stay_requests_host ON stay_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_stay_requests_status ON stay_requests(status);
CREATE INDEX IF NOT EXISTS idx_trips_traveler ON trips(traveler_id);
CREATE INDEX IF NOT EXISTS idx_trips_host ON trips(host_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_score ON profiles(trust_score);
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_user_type ON verification_documents(user_id, document_type);

-- Updated_at triggers
CREATE TRIGGER update_stay_requests_updated_at
  BEFORE UPDATE ON stay_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON privacy_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create privacy settings on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_privacy ON profiles;
CREATE TRIGGER on_profile_created_privacy
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_privacy_settings();

-- Check if viewer can see private profile data (approved stay)
CREATE OR REPLACE FUNCTION public.can_view_private_profile(viewer UUID, target UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF viewer IS NULL OR target IS NULL THEN RETURN FALSE; END IF;
  IF viewer = target THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM stay_requests
    WHERE status = 'approved'
    AND (
      (traveler_id = viewer AND host_id = target)
      OR (host_id = viewer AND traveler_id = target)
    )
  );
END;
$$;

-- Calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p profiles)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  filled INTEGER := 0;
  total INTEGER := 8;
BEGIN
  IF p.full_name IS NOT NULL AND p.full_name != '' THEN filled := filled + 1; END IF;
  IF p.bio IS NOT NULL AND p.bio != '' THEN filled := filled + 1; END IF;
  IF p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN filled := filled + 1; END IF;
  IF p.location IS NOT NULL AND p.location != '' THEN filled := filled + 1; END IF;
  IF p.phone IS NOT NULL AND p.phone != '' THEN filled := filled + 1; END IF;
  IF p.role IS NOT NULL THEN filled := filled + 1; END IF;
  IF p.languages IS NOT NULL AND array_length(p.languages, 1) > 0 THEN filled := filled + 1; END IF;
  IF p.onboarding_complete THEN filled := filled + 1; END IF;
  RETURN LEAST(100, ROUND((filled::NUMERIC / total) * 100));
END;
$$;

-- Calculate trust score (0-100)
CREATE OR REPLACE FUNCTION public.calculate_trust_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p profiles%ROWTYPE;
  score INTEGER := 0;
  breakdown JSONB := '{}';
  gov_id_verified BOOLEAN := FALSE;
  completed_trips INTEGER := 0;
  positive_reviews INTEGER := 0;
  total_reviews INTEGER := 0;
  trip_points INTEGER := 0;
  review_points INTEGER := 0;
  profile_points INTEGER := 0;
BEGIN
  SELECT * INTO p FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Email verified (10)
  IF p.email_verified_at IS NOT NULL THEN
    score := score + 10;
    breakdown := breakdown || '{"email_verified": 10}'::jsonb;
  END IF;

  -- Phone verified (10)
  IF p.phone_verified_at IS NOT NULL THEN
    score := score + 10;
    breakdown := breakdown || '{"phone_verified": 10}'::jsonb;
  END IF;

  -- Government ID (15)
  SELECT EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'government_id' AND status = 'verified'
  ) INTO gov_id_verified;
  IF gov_id_verified THEN
    score := score + 15;
    breakdown := breakdown || '{"government_id": 15}'::jsonb;
  END IF;

  -- Address verification (10)
  IF p.address_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'address_proof' AND status = 'verified'
  ) THEN
    score := score + 10;
    breakdown := breakdown || '{"address_verification": 10}'::jsonb;
  END IF;

  -- Video verification (15)
  IF p.video_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'video_verification' AND status = 'verified'
  ) THEN
    score := score + 15;
    breakdown := breakdown || '{"video_verification": 15}'::jsonb;
  END IF;

  -- Profile completion (10 max, scaled)
  profile_points := ROUND((calculate_profile_completion(p)::NUMERIC / 100) * 10);
  score := score + profile_points;
  breakdown := breakdown || jsonb_build_object('profile_completion', profile_points);

  -- Completed trips (15 max, 5 per trip)
  SELECT COUNT(*) INTO completed_trips FROM trips
  WHERE (traveler_id = p_user_id OR host_id = p_user_id) AND status = 'completed';
  trip_points := LEAST(15, completed_trips * 5);
  score := score + trip_points;
  breakdown := breakdown || jsonb_build_object('completed_trips', trip_points);

  -- Positive reviews (15 max)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_positive) INTO total_reviews, positive_reviews
  FROM reviews WHERE reviewee_id = p_user_id;
  IF total_reviews > 0 THEN
    review_points := ROUND((positive_reviews::NUMERIC / total_reviews) * 15);
  END IF;
  score := score + review_points;
  breakdown := breakdown || jsonb_build_object('positive_reviews', review_points);

  score := LEAST(100, score);

  UPDATE profiles SET
    trust_score = score,
    trust_score_breakdown = breakdown,
    profile_completion = calculate_profile_completion(p)
  WHERE id = p_user_id;

  -- Award trust badges
  IF gov_id_verified THEN
    INSERT INTO trust_badges (user_id, badge_type) VALUES (p_user_id, 'identity_verified')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  IF p.phone_verified_at IS NOT NULL THEN
    INSERT INTO trust_badges (user_id, badge_type) VALUES (p_user_id, 'phone_verified')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  IF p.video_verified_at IS NOT NULL THEN
    INSERT INTO trust_badges (user_id, badge_type) VALUES (p_user_id, 'video_verified')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  IF p.address_verified_at IS NOT NULL THEN
    INSERT INTO trust_badges (user_id, badge_type) VALUES (p_user_id, 'address_verified')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  IF score >= 70 THEN
    INSERT INTO trust_badges (user_id, badge_type) VALUES (p_user_id, 'trusted_member')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  IF completed_trips >= 3 THEN
    INSERT INTO trust_badges (user_id, badge_type)
    VALUES (p_user_id, CASE WHEN p.role = 'host' THEN 'experienced_host' ELSE 'experienced_traveler' END)
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;

  RETURN score;
END;
$$;

-- Trigger to recalculate trust score
CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
BEGIN
  uid := COALESCE(NEW.user_id, NEW.id, NEW.traveler_id, NEW.host_id, NEW.reviewer_id, NEW.reviewee_id);
  IF uid IS NOT NULL THEN
    PERFORM calculate_trust_score(uid);
  END IF;
  IF TG_TABLE_NAME = 'reviews' AND NEW.reviewee_id IS DISTINCT FROM uid THEN
    PERFORM calculate_trust_score(NEW.reviewee_id);
  END IF;
  IF TG_TABLE_NAME = 'trips' THEN
    PERFORM calculate_trust_score(NEW.traveler_id);
    PERFORM calculate_trust_score(NEW.host_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_trust_on_profile ON profiles;
CREATE TRIGGER recalc_trust_on_profile
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score();

DROP TRIGGER IF EXISTS recalc_trust_on_verification ON verification_documents;
CREATE TRIGGER recalc_trust_on_verification
  AFTER INSERT OR UPDATE ON verification_documents
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score();

DROP TRIGGER IF EXISTS recalc_trust_on_trip ON trips;
CREATE TRIGGER recalc_trust_on_trip
  AFTER INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score();

DROP TRIGGER IF EXISTS recalc_trust_on_review ON reviews;
CREATE TRIGGER recalc_trust_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score();

-- Public profile view (no PII)
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  split_part(full_name, ' ', 1) AS first_name,
  role,
  bio,
  location,
  languages,
  trust_score,
  profile_completion,
  verification_status,
  onboarding_complete,
  created_at
FROM profiles
WHERE onboarding_complete = TRUE;
-- Fore Beyond Phase 2: RLS policies for trust, privacy, stay requests
-- Migration: 005_phase2_rls_policies

ALTER TABLE stay_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;

DROP POLICY IF EXISTS "Users can view own full profile" ON profiles;
CREATE POLICY "Users can view own full profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users see public profile fields"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND onboarding_complete = TRUE
    AND auth.uid() != id
    AND NOT can_view_private_profile(auth.uid(), id)
  );

CREATE POLICY "Approved stay members see full profile"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND can_view_private_profile(auth.uid(), id)
  );

CREATE POLICY "Users can view own stay requests"
  ON stay_requests FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Travelers can create stay requests"
  ON stay_requests FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Participants can update stay requests"
  ON stay_requests FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Participants can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Users can view reviews about them or by them"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Participants can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can view own privacy settings"
  ON privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
  ON privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
  ON privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own cookie consents"
  ON cookie_consents FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert cookie consent"
  ON cookie_consents FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own cookie consents"
  ON cookie_consents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own export requests"
  ON data_export_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view completed traveler profiles" ON traveler_profiles;
DROP POLICY IF EXISTS "Authenticated users can view host profiles" ON host_profiles;

CREATE POLICY "Approved stay can view traveler profile"
  ON traveler_profiles FOR SELECT
  USING (can_view_private_profile(auth.uid(), user_id));

CREATE POLICY "Approved stay can view host profile"
  ON host_profiles FOR SELECT
  USING (can_view_private_profile(auth.uid(), user_id));

GRANT SELECT ON public_profiles TO authenticated;
