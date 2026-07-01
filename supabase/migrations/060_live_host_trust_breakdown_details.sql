-- Live host trust breakdown with underlying counts (listing-safe, no PII).

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
    score := score + 10;
    breakdown := breakdown || '{"email_verified": 10}'::jsonb;
    details := details || jsonb_build_object(
      'email_verified',
      jsonb_build_object('points', 10, 'max_points', 10, 'verified', TRUE)
    );
  ELSE
    details := details || jsonb_build_object(
      'email_verified',
      jsonb_build_object('points', 0, 'max_points', 10, 'verified', FALSE)
    );
  END IF;

  IF p.phone_verified_at IS NOT NULL THEN
    score := score + 10;
    breakdown := breakdown || '{"phone_verified": 10}'::jsonb;
    details := details || jsonb_build_object(
      'phone_verified',
      jsonb_build_object('points', 10, 'max_points', 10, 'verified', TRUE)
    );
  ELSE
    details := details || jsonb_build_object(
      'phone_verified',
      jsonb_build_object('points', 0, 'max_points', 10, 'verified', FALSE)
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'government_id' AND status = 'verified'
  ) INTO gov_id_verified;
  IF gov_id_verified THEN
    score := score + 15;
    breakdown := breakdown || '{"government_id": 15}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'government_id',
    jsonb_build_object('points', CASE WHEN gov_id_verified THEN 15 ELSE 0 END, 'max_points', 15, 'verified', gov_id_verified)
  );

  address_verified := p.address_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'address_proof' AND status = 'verified'
  );
  IF address_verified THEN
    score := score + 10;
    breakdown := breakdown || '{"address_verification": 10}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'address_verification',
    jsonb_build_object('points', CASE WHEN address_verified THEN 10 ELSE 0 END, 'max_points', 10, 'verified', address_verified)
  );

  video_verified := p.video_verified_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = v_host_id AND document_type = 'video_verification' AND status = 'verified'
  );
  IF video_verified THEN
    score := score + 15;
    breakdown := breakdown || '{"video_verification": 15}'::jsonb;
  END IF;
  details := details || jsonb_build_object(
    'video_verification',
    jsonb_build_object('points', CASE WHEN video_verified THEN 15 ELSE 0 END, 'max_points', 15, 'verified', video_verified)
  );

  profile_points := ROUND((profile_pct::NUMERIC / 100) * 10);
  score := score + profile_points;
  breakdown := breakdown || jsonb_build_object('profile_completion', profile_points);
  details := details || jsonb_build_object(
    'profile_completion',
    jsonb_build_object('points', profile_points, 'max_points', 10, 'profile_completion_percent', profile_pct)
  );

  SELECT COUNT(*) INTO completed_trips FROM trips
  WHERE (traveler_id = v_host_id OR host_id = v_host_id) AND status = 'completed';

  SELECT COUNT(*) INTO completed_host_trips FROM trips
  WHERE host_id = v_host_id AND status = 'completed';

  trip_points := LEAST(15, completed_trips * 5);
  score := score + trip_points;
  breakdown := breakdown || jsonb_build_object('completed_trips', trip_points);
  details := details || jsonb_build_object(
    'completed_trips',
    jsonb_build_object(
      'points', trip_points,
      'max_points', 15,
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
    review_points := ROUND((positive_reviews::NUMERIC / total_reviews) * 15);
  END IF;
  score := score + review_points;
  breakdown := breakdown || jsonb_build_object('positive_reviews', review_points);
  details := details || jsonb_build_object(
    'positive_reviews',
    jsonb_build_object(
      'points', review_points,
      'max_points', 15,
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

GRANT EXECUTE ON FUNCTION public.get_listing_host_trust_breakdown(UUID) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
