-- Confirmed stays were stored with payment_status = 'pending' even after the
-- service fee succeeded (stripe_payment_intent_id is set; the host balance is
-- paid off-platform). complete_trip required payment_status = 'paid', so ended
-- stays never became 'completed' and profile stay counts / trust scores stayed at 0.

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
      AND t.end_date IS NOT NULL
      AND t.end_date <= CURRENT_DATE
      AND sb.payment_status NOT IN ('refunded', 'failed')
      AND (
        sb.payment_status = 'paid'
        OR sb.stripe_payment_intent_id IS NOT NULL
      )
  );
$$;

-- Called with the service role (bypasses RLS). No caller-supplied ids.
CREATE OR REPLACE FUNCTION public.complete_ended_confirmed_trips()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH ended AS (
    UPDATE trips t
    SET status = 'completed',
        completed_at = COALESCE(t.completed_at, NOW())
    FROM stay_bookings sb
    WHERE sb.trip_id = t.id
      AND t.status IN ('upcoming', 'active')
      AND t.end_date IS NOT NULL
      AND t.end_date <= CURRENT_DATE
      AND sb.payment_status NOT IN ('refunded', 'failed')
      AND (
        sb.payment_status = 'paid'
        OR sb.stripe_payment_intent_id IS NOT NULL
      )
    RETURNING t.id, t.stay_request_id
  ),
  closed_requests AS (
    UPDATE stay_requests sr
    SET status = 'completed',
        updated_at = NOW()
    FROM ended e
    WHERE sr.id = e.stay_request_id
      AND sr.status = 'approved'
    RETURNING sr.id
  )
  SELECT COUNT(*)::INTEGER INTO v_count FROM ended;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_ended_confirmed_trips() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_ended_confirmed_trips() TO service_role;

-- Marketplace visitors could not see completed stays when the policy's
-- profiles join was hidden by profile RLS. Published listings are already public.
DROP POLICY IF EXISTS "Anyone can view completed trips on published listings" ON trips;
CREATE POLICY "Anyone can view completed trips on published listings"
  ON trips FOR SELECT
  USING (
    status = 'completed'
    AND listing_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM host_listings hl
      WHERE hl.id = trips.listing_id
        AND hl.status = 'published'
    )
  );

SELECT public.complete_ended_confirmed_trips();

NOTIFY pgrst, 'reload schema';
