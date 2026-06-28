-- Allow trip/experience participants to edit their own reviews after submission.

CREATE OR REPLACE FUNCTION public.can_edit_own_review(p_review_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM reviews r
    JOIN trips t ON t.id = r.trip_id
    WHERE r.id = p_review_id
      AND r.reviewer_id = p_user_id
      AND t.status = 'completed'
  ) THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'experience_booking_id'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'experience_bookings'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM reviews r
      JOIN experience_bookings eb ON eb.id = r.experience_booking_id
      WHERE r.id = p_review_id
        AND r.reviewer_id = p_user_id
        AND eb.status = 'completed'
    );
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_edit_own_review(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Reviewers can edit own reviews" ON reviews;
CREATE POLICY "Reviewers can edit own reviews"
  ON reviews FOR UPDATE
  USING (
    auth.uid() = reviewer_id
    AND public.can_edit_own_review(id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = reviewer_id
    AND rating >= 1
    AND rating <= 5
  );

DROP TRIGGER IF EXISTS auto_moderate_review_trigger ON reviews;
CREATE TRIGGER auto_moderate_review_trigger
  BEFORE INSERT OR UPDATE OF rating, comment ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_review();
