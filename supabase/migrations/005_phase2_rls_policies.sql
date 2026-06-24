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
