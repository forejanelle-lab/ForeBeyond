-- Fix withdraw_approved_stay: trips table has no updated_at column

CREATE OR REPLACE FUNCTION public.withdraw_approved_stay(
  p_stay_request_id UUID,
  p_reason TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stay stay_requests%ROWTYPE;
  v_host_name TEXT;
  v_trip_id UUID;
  v_reason TEXT;
BEGIN
  v_reason := trim(coalesce(p_reason, ''));

  IF char_length(v_reason) < 10 THEN
    RAISE EXCEPTION 'Please provide a reason of at least 10 characters for the guest.';
  END IF;

  SELECT * INTO v_stay FROM stay_requests WHERE id = p_stay_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stay request not found';
  END IF;

  IF v_stay.host_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to withdraw this stay';
  END IF;

  IF v_stay.status != 'approved' THEN
    RAISE EXCEPTION 'Only confirmed stays can be withdrawn';
  END IF;

  UPDATE stay_requests
  SET
    status = 'cancelled',
    withdrawal_reason = v_reason,
    updated_at = NOW()
  WHERE id = p_stay_request_id;

  SELECT id INTO v_trip_id
  FROM trips
  WHERE stay_request_id = p_stay_request_id
  LIMIT 1;

  IF v_trip_id IS NOT NULL THEN
    UPDATE trips
    SET status = 'cancelled'
    WHERE id = v_trip_id;
  END IF;

  UPDATE stay_bookings
  SET payment_status = 'refunded', updated_at = NOW()
  WHERE stay_request_id = p_stay_request_id
    AND payment_status = 'paid';

  SELECT split_part(full_name, ' ', 1) INTO v_host_name
  FROM profiles
  WHERE id = v_stay.host_id;

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    v_stay.traveler_id,
    'stay_withdrawn',
    coalesce(v_host_name, 'Your host') || ' withdrew your confirmed stay',
    v_reason,
    '/dashboard/requests/' || p_stay_request_id::text,
    jsonb_build_object(
      'stay_request_id', p_stay_request_id,
      'withdrawal_reason', v_reason
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_approved_stay(UUID, TEXT) TO authenticated;
