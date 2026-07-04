-- Allow stay requests on dates that overlap existing stays; hosts decide capacity.
-- Only host-marked unavailable dates remain hard-blocked.

CREATE OR REPLACE FUNCTION public.stay_dates_overlap_blocked(
  p_listing_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_request_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_blocked listing_blocked_dates%ROWTYPE;
BEGIN
  IF p_listing_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_end_date <= p_start_date THEN
    RETURN 'Check-out must be after check-in.';
  END IF;

  SELECT * INTO v_blocked
  FROM listing_blocked_dates lbd
  WHERE lbd.listing_id = p_listing_id
    AND p_start_date < lbd.end_date
    AND lbd.start_date < p_end_date
  LIMIT 1;

  IF FOUND THEN
    RETURN 'These dates overlap with dates the host marked as unavailable.';
  END IF;

  RETURN NULL;
END;
$$;
