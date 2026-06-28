-- Remove background check from the member verification flow.

DROP TRIGGER IF EXISTS auto_verify_background_check_consent ON verification_documents;
DROP FUNCTION IF EXISTS public.auto_verify_background_check_consent();

DELETE FROM trust_badges WHERE badge_type = 'background_checked';

DELETE FROM verification_documents WHERE document_type = 'background_check';

CREATE OR REPLACE FUNCTION public.sync_profile_verification_status(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gov_status verification_status;
BEGIN
  SELECT status INTO gov_status
  FROM verification_documents
  WHERE user_id = p_user_id AND document_type = 'government_id'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF gov_status = 'verified' THEN
    UPDATE profiles
    SET verification_status = 'verified', updated_at = NOW()
    WHERE id = p_user_id;
  ELSIF gov_status = 'rejected' THEN
    UPDATE profiles
    SET verification_status = 'rejected', updated_at = NOW()
    WHERE id = p_user_id;
  ELSIF EXISTS (
    SELECT 1 FROM verification_documents
    WHERE user_id = p_user_id
      AND status IN ('pending', 'in_review')
  ) THEN
    UPDATE profiles
    SET verification_status = 'pending', updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_verification(
  p_document_id UUID,
  p_admin_id UUID,
  p_status verification_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_doc_type document_type;
  v_doc_label TEXT;
  v_note TEXT;
BEGIN
  IF NOT is_admin(p_admin_id) AND NOT is_trust_moderator(p_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE verification_documents
  SET
    status = p_status,
    notes = COALESCE(p_notes, notes),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_document_id
  RETURNING user_id, document_type INTO v_user_id, v_doc_type;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  PERFORM sync_profile_verification_status(v_user_id);

  IF p_status = 'rejected' THEN
    v_doc_label := replace(v_doc_type::text, '_', ' ');
    v_note := COALESCE(
      NULLIF(TRIM(p_notes), ''),
      'Please open Verification Center to review and resubmit.'
    );

    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      v_user_id,
      'verification_rejected',
      'Verification incomplete',
      format('Your %s needs to be updated. %s', v_doc_label, v_note),
      '/verification-center',
      jsonb_build_object(
        'document_type', v_doc_type,
        'document_id', p_document_id,
        'admin_notes', p_notes
      )
    );
  END IF;

  PERFORM calculate_trust_score(v_user_id);
  RETURN TRUE;
END;
$$;

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

SELECT calculate_trust_score(id) FROM profiles;
