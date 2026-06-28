-- Fix badge_type cast when awarding experienced_host / experienced_traveler badges.

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
    VALUES (
      p_user_id,
      (CASE WHEN p.role = 'host' THEN 'experienced_host' ELSE 'experienced_traveler' END)::badge_type
    )
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;

  RETURN score;
END;
$$;
