-- Block calendar dates for pending, host-approved, and confirmed stays (not only approved).

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
  v_stay stay_requests%ROWTYPE;
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

  SELECT * INTO v_stay
  FROM stay_requests sr
  WHERE sr.listing_id = p_listing_id
    AND sr.status IN ('pending', 'host_approved', 'approved')
    AND (p_exclude_request_id IS NULL OR sr.id != p_exclude_request_id)
    AND p_start_date < sr.end_date
    AND sr.start_date < p_end_date
  LIMIT 1;

  IF FOUND THEN
    IF v_stay.status = 'pending' THEN
      RETURN 'These dates overlap with a pending stay request.';
    END IF;
    RETURN 'These dates overlap with a reserved or confirmed stay.';
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_stay_request_available_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_error TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR
     NEW.start_date IS DISTINCT FROM OLD.start_date OR
     NEW.end_date IS DISTINCT FROM OLD.end_date OR
     NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('pending', 'host_approved', 'approved') THEN
      v_error := stay_dates_overlap_blocked(
        NEW.listing_id,
        NEW.start_date,
        NEW.end_date,
        NEW.id
      );

      IF v_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_error;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
