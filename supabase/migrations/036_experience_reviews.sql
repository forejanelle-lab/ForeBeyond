-- Allow reviews tied to completed experience bookings (in addition to trips)

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS experience_booking_id UUID REFERENCES experience_bookings(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_experience_booking_reviewer
  ON reviews (experience_booking_id, reviewer_id)
  WHERE experience_booking_id IS NOT NULL;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_source_required;
ALTER TABLE reviews ADD CONSTRAINT reviews_source_required
  CHECK (trip_id IS NOT NULL OR experience_booking_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.can_submit_experience_review(
  p_experience_booking_id UUID,
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
    SELECT 1
    FROM experience_bookings eb
    WHERE eb.id = p_experience_booking_id
      AND eb.status = 'completed'
      AND eb.traveler_id = p_reviewer_id
      AND eb.host_id = p_reviewee_id
      AND NOT EXISTS (
        SELECT 1
        FROM reviews r
        WHERE r.experience_booking_id = p_experience_booking_id
          AND r.reviewer_id = p_reviewer_id
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_submit_experience_review(UUID, UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Participants can submit reviews after completed trip" ON reviews;

CREATE POLICY "Participants can submit reviews after completed trip"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id != reviewee_id
    AND rating >= 1
    AND rating <= 5
    AND (
      (
        trip_id IS NOT NULL
        AND experience_booking_id IS NULL
        AND can_submit_review(trip_id, reviewer_id, reviewee_id)
      )
      OR (
        experience_booking_id IS NOT NULL
        AND trip_id IS NULL
        AND can_submit_experience_review(experience_booking_id, reviewer_id, reviewee_id)
      )
    )
  );
