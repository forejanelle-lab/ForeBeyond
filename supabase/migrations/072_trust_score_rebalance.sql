-- Rebalance trust score: less weight on trips/reviews, more on verification.
-- Max total remains 100.

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
    score := score + 12;
    breakdown := breakdown || '{"email_verified": 12}'::jsonb;
  END IF;

  IF p.phone_verified_at IS NOT NULL THEN
    score := score + 12;
    breakdown := breakdown || '{"phone_verified": 12}'::jsonb;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'government_id' AND status = 'verified'
  ) INTO gov_id_verified;
  IF gov_id_verified THEN
    score := score + 18;
    breakdown := breakdown || '{"government_id": 18}'::jsonb;
  END IF;

  IF p.address_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'address_proof' AND status = 'verified'
  ) THEN
    score := score + 12;
    breakdown := breakdown || '{"address_verification": 12}'::jsonb;
  END IF;

  IF p.video_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id AND document_type = 'video_verification' AND status = 'verified'
  ) THEN
    score := score + 18;
    breakdown := breakdown || '{"video_verification": 18}'::jsonb;
  END IF;

  profile_points := ROUND((calculate_profile_completion(p)::NUMERIC / 100) * 13);
  score := score + profile_points;
  breakdown := breakdown || jsonb_build_object('profile_completion', profile_points);

  SELECT COUNT(*) INTO completed_trips FROM trips
  WHERE (traveler_id = p_user_id OR host_id = p_user_id) AND status = 'completed';
  trip_points := LEAST(8, completed_trips * 2);
  score := score + trip_points;
  breakdown := breakdown || jsonb_build_object('completed_trips', trip_points);

  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_positive) INTO total_reviews, positive_reviews
  FROM reviews
  WHERE reviewee_id = p_user_id AND moderation_status = 'approved';
  IF total_reviews > 0 THEN
    review_points := ROUND((positive_reviews::NUMERIC / total_reviews) * 7);
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

CREATE OR REPLACE FUNCTION public.get_listing_host_trust_breakdown(p_listing_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id UUID;
  p profiles%ROWTYPE;
  score INTEGER := 0;
  breakdown JSONB := '{}';
  details JSONB := '{}';
  gov_id_verified BOOLEAN := FALSE;
  address_verified BOOLEAN := FALSE;
  video_verified BOOLEAN := FALSE;
  completed_trips INTEGER := 0;
  completed_host_trips INTEGER := 0;
  total_reviews INTEGER := 0;
  positive_reviews INTEGER := 0;
  listing_reviews INTEGER := 0;
  listing_positive_reviews INTEGER := 0;
  avg_rating NUMERIC := NULL;
  trip_points INTEGER := 0;
  review_points INTEGER := 0;
  profile_points INTEGER := 0;
  profile_pct INTEGER := 0;
BEGIN
  SELECT hl.host_id INTO v_host_id
  FROM host_listings hl
  JOIN profiles pr ON pr.id = hl.host_id
  WHERE hl.id = p_listing_id
    AND hl.status = 'published'
    AND pr.onboarding_complete = TRUE;

  IF v_host_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO p FROM profiles WHERE id = v_host_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  profile_pct := calculate_profile_completion(p);

  IF p.email_verified_at IS NOT NULL THEN
    score := score + 12;
    breakdown := breakdown || '{"email_verified": 12}'::jsonb;
    details := details || jsonb_build_object(
      'email_verified',
      jsonb_build_object('points', 12, 'max_points', 12, 'verified', TRUE)
    );
  ELSE
    details := details || jsonb_build_object(
      'email_verified',
      jsonb_build_object('points', 0, 'max_points', 12, 'verified', FALSE)
    );
  END IF;

  IF p.phone_verified_at IS NOT NULL THEN
    score := score + 12;
    breakdown := breakdown || '{"phone_verified": 12}'::jsonb;
    details := details || jsonb_build_object(
      'phone_verified',
      jsonb_build_object('points', 12, 'max_points', 12, 'verified', TRUE)
    );
  ELSE
    details := details || jsonb_build_object(
      'phone_verified',
      jsonb_build_object('points', 0, 'max_points', 12, 'verified', FALSE)
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'government_id' AND status = 'verified'
  ) INTO gov_id_verified;
  IF gov_id_verified THEN
    score := score + 18;
    breakdown := breakdown || '{"government_id": 18}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'government_id',
    jsonb_build_object('points', CASE WHEN gov_id_verified THEN 18 ELSE 0 END, 'max_points', 18, 'verified', gov_id_verified)
  );

  address_verified := p.address_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'address_proof' AND status = 'verified'
  );
  IF address_verified THEN
    score := score + 12;
    breakdown := breakdown || '{"address_verification": 12}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'address_verification',
    jsonb_build_object('points', CASE WHEN address_verified THEN 12 ELSE 0 END, 'max_points', 12, 'verified', address_verified)
  );

  video_verified := p.video_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'video_verification' AND status = 'verified'
  );
  IF video_verified THEN
    score := score + 18;
    breakdown := breakdown || '{"video_verification": 18}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'video_verification',
    jsonb_build_object('points', CASE WHEN video_verified THEN 18 ELSE 0 END, 'max_points', 18, 'verified', video_verified)
  );

  profile_points := ROUND((profile_pct::NUMERIC / 100) * 13);
  score := score + profile_points;
  breakdown := breakdown || jsonb_build_object('profile_completion', profile_points);
  details := details || jsonb_build_object(
    'profile_completion',
    jsonb_build_object('points', profile_points, 'max_points', 13, 'profile_completion_percent', profile_pct)
  );

  SELECT COUNT(*) INTO completed_trips FROM trips
  WHERE (traveler_id = v_host_id OR host_id = v_host_id) AND status = 'completed';

  SELECT COUNT(*) INTO completed_host_trips FROM trips
  WHERE host_id = v_host_id AND status = 'completed';

  trip_points := LEAST(8, completed_trips * 2);
  score := score + trip_points;
  breakdown := breakdown || jsonb_build_object('completed_trips', trip_points);
  details := details || jsonb_build_object(
    'completed_trips',
    jsonb_build_object(
      'points', trip_points,
      'max_points', 8,
      'completed_trips', completed_trips,
      'completed_host_trips', completed_host_trips
    )
  );

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE r.is_positive),
    ROUND(AVG(r.rating)::NUMERIC, 1)
  INTO total_reviews, positive_reviews, avg_rating
  FROM reviews r
  WHERE r.reviewee_id = v_host_id
    AND r.moderation_status = 'approved'
    AND r.reviewer_role = 'traveler';

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE r.is_positive)
  INTO listing_reviews, listing_positive_reviews
  FROM reviews r
  LEFT JOIN trips t ON t.id = r.trip_id
  WHERE r.reviewee_id = v_host_id
    AND r.moderation_status = 'approved'
    AND r.reviewer_role = 'traveler'
    AND t.listing_id = p_listing_id;

  IF total_reviews > 0 THEN
    review_points := ROUND((positive_reviews::NUMERIC / total_reviews) * 7);
  END IF;
  score := score + review_points;
  breakdown := breakdown || jsonb_build_object('positive_reviews', review_points);
  details := details || jsonb_build_object(
    'positive_reviews',
    jsonb_build_object(
      'points', review_points,
      'max_points', 7,
      'total_reviews', total_reviews,
      'positive_reviews', positive_reviews,
      'listing_reviews', listing_reviews,
      'listing_positive_reviews', listing_positive_reviews,
      'average_rating', avg_rating
    )
  );

  score := LEAST(100, score);

  RETURN jsonb_build_object(
    'trust_score', score,
    'trust_score_breakdown', breakdown,
    'metric_details', details,
    'host_review_summary', jsonb_build_object(
      'total_reviews', total_reviews,
      'positive_reviews', positive_reviews,
      'average_rating', avg_rating,
      'listing_reviews', listing_reviews
    )
  );
END;
$$;

SELECT calculate_trust_score(id) FROM profiles;

NOTIFY pgrst, 'reload schema';
