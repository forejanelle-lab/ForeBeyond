-- Fore Beyond Phase 8: Review System (combined setup)

-- Run with: npm run db:phase8



-- Fore Beyond Phase 8: Review System, Trip Completion, Trust Score Integration
-- Migration: 018_phase8_review_system.sql

DO $$ BEGIN
  CREATE TYPE review_moderation_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_trust_moderator BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_status review_moderation_status DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_role TEXT;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_role_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_role_check
  CHECK (reviewer_role IS NULL OR reviewer_role IN ('traveler', 'host'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_trip_reviewer
  ON reviews (trip_id, reviewer_id)
  WHERE trip_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews (moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON reviews (trip_id);

-- Trip completion helpers
CREATE OR REPLACE FUNCTION public.is_trip_participant(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE id = p_trip_id
    AND (traveler_id = p_user_id OR host_id = p_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_complete_trip(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trips t
    JOIN stay_bookings sb ON sb.trip_id = t.id
    WHERE t.id = p_trip_id
      AND t.status IN ('upcoming', 'active')
      AND (t.traveler_id = p_user_id OR t.host_id = p_user_id)
      AND sb.payment_status = 'paid'
      AND t.end_date IS NOT NULL
      AND t.end_date <= CURRENT_DATE
  );
$$;

CREATE OR REPLACE FUNCTION public.complete_trip(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stay_request_id UUID;
BEGIN
  IF NOT can_complete_trip(p_trip_id, p_user_id) THEN
    RETURN FALSE;
  END IF;

  UPDATE trips
  SET status = 'completed', completed_at = NOW()
  WHERE id = p_trip_id
  RETURNING stay_request_id INTO v_stay_request_id;

  IF v_stay_request_id IS NOT NULL THEN
    UPDATE stay_requests SET status = 'completed', updated_at = NOW()
    WHERE id = v_stay_request_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_submit_review(
  p_trip_id UUID,
  p_reviewer_id UUID,
  p_reviewee_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips t
    WHERE t.id = p_trip_id
      AND t.status = 'completed'
      AND (
        (t.traveler_id = p_reviewer_id AND t.host_id = p_reviewee_id)
        OR (t.host_id = p_reviewer_id AND t.traveler_id = p_reviewee_id)
      )
      AND NOT EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.trip_id = p_trip_id AND r.reviewer_id = p_reviewer_id
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trust_moderator(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_trust_moderator FROM profiles WHERE id = p_user_id),
    FALSE
  );
$$;

-- Auto-approve high ratings; flag low ratings for moderation
CREATE OR REPLACE FUNCTION public.auto_moderate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.moderation_status := 'approved';
  NEW.moderated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_moderate_review_trigger ON reviews;
CREATE TRIGGER auto_moderate_review_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION auto_moderate_review();

-- Trust score: only count approved reviews
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

  IF p.email_verified_at IS NOT NULL THEN
    score := score + 10;
    breakdown := breakdown || '{"email_verified": 10}'::jsonb;
  END IF;

  IF p.phone_verified_at IS NOT NULL THEN
    score := score + 10;
    breakdown := breakdown || '{"phone_verified": 10}'::jsonb;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'government_id' AND status = 'verified'
  ) INTO gov_id_verified;
  IF gov_id_verified THEN
    score := score + 15;
    breakdown := breakdown || '{"government_id": 15}'::jsonb;
  END IF;

  IF p.address_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'address_proof' AND status = 'verified'
  ) THEN
    score := score + 10;
    breakdown := breakdown || '{"address_verification": 10}'::jsonb;
  END IF;

  IF p.video_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'video_verification' AND status = 'verified'
  ) THEN
    score := score + 15;
    breakdown := breakdown || '{"video_verification": 15}'::jsonb;
  END IF;

  profile_points := ROUND((calculate_profile_completion(p)::NUMERIC / 100) * 10);
  score := score + profile_points;
  breakdown := breakdown || jsonb_build_object('profile_completion', profile_points);

  SELECT COUNT(*) INTO completed_trips FROM trips
  WHERE (traveler_id = p_user_id OR host_id = p_user_id) AND status = 'completed';
  trip_points := LEAST(15, completed_trips * 5);
  score := score + trip_points;
  breakdown := breakdown || jsonb_build_object('completed_trips', trip_points);

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_positive) INTO total_reviews, positive_reviews
  FROM reviews
  WHERE reviewee_id = p_user_id AND moderation_status = 'approved';
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

CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;
  PERFORM calculate_trust_score(NEW.reviewer_id);
  IF NEW.reviewee_id IS DISTINCT FROM NEW.reviewer_id THEN
    PERFORM calculate_trust_score(NEW.reviewee_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_trust_on_review ON reviews;
CREATE TRIGGER recalc_trust_on_review
  AFTER INSERT OR UPDATE OF moderation_status ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_trust_score_reviews();

-- Notify reviewee when review is approved
CREATE OR REPLACE FUNCTION public.notify_review_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.moderation_status = 'approved'
    AND (TG_OP = 'INSERT' OR OLD.moderation_status IS DISTINCT FROM 'approved') THEN
    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.reviewee_id,
      'review_received',
      'New review received',
      'Someone left you a ' || NEW.rating || '-star review.',
      '/trust-center/dashboard',
      jsonb_build_object('review_id', NEW.id, 'rating', NEW.rating)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_review_approved ON reviews;
CREATE TRIGGER notify_on_review_approved
  AFTER INSERT OR UPDATE OF moderation_status ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_review_approved();

-- Public view for approved reviews with reviewer first name
CREATE OR REPLACE VIEW public_reviews AS
SELECT
  r.id,
  r.trip_id,
  r.reviewer_id,
  r.reviewee_id,
  r.rating,
  r.comment,
  r.is_positive,
  r.reviewer_role,
  r.created_at,
  split_part(p.full_name, ' ', 1) AS reviewer_first_name
FROM reviews r
JOIN profiles p ON p.id = r.reviewer_id
WHERE r.moderation_status = 'approved';

GRANT SELECT ON public_reviews TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_trip(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_complete_trip(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_submit_review(UUID, UUID, UUID) TO authenticated;
-- Fore Beyond Phase 8: RLS for review system and trip completion
-- Migration: 019_phase8_review_rls.sql

DROP POLICY IF EXISTS "Users can view reviews about them or by them" ON reviews;
DROP POLICY IF EXISTS "Participants can create reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews of published hosts" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews of published experience hosts" ON reviews;

CREATE POLICY "Users can view own and approved reviews"
  ON reviews FOR SELECT
  USING (
    auth.uid() = reviewer_id
    OR auth.uid() = reviewee_id
    OR moderation_status = 'approved'
    OR is_trust_moderator(auth.uid())
  );

CREATE POLICY "Participants can submit reviews after completed trip"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND can_submit_review(trip_id, reviewer_id, reviewee_id)
    AND reviewer_id != reviewee_id
    AND rating >= 1 AND rating <= 5
    AND trip_id IS NOT NULL
  );

CREATE POLICY "Trust moderators can moderate reviews"
  ON reviews FOR UPDATE
  USING (is_trust_moderator(auth.uid()))
  WITH CHECK (is_trust_moderator(auth.uid()));

DROP POLICY IF EXISTS "Participants can update trips" ON trips;
CREATE POLICY "Participants can complete trips"
  ON trips FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id)
  WITH CHECK (
    auth.uid() = traveler_id OR auth.uid() = host_id
  );

-- Allow messaging on completed stays too
DROP POLICY IF EXISTS "Approved stay participants can view conversations" ON conversations;
CREATE POLICY "Approved stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = conversations.stay_request_id
      AND sr.status IN ('approved', 'completed')
    )
  );

DROP POLICY IF EXISTS "Approved stay participants can send messages" ON stay_messages;
CREATE POLICY "Approved stay participants can send messages"
  ON stay_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN stay_requests sr ON sr.id = c.stay_request_id
      WHERE c.id = stay_messages.conversation_id
      AND sr.status IN ('approved', 'completed')
      AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
    )
  );
