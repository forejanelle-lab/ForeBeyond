-- Host block-out dates on listings + server-side stay date validation

CREATE TABLE listing_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES host_listings(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT listing_blocked_dates_valid_range CHECK (end_date > start_date)
);

CREATE INDEX listing_blocked_dates_listing_id_idx ON listing_blocked_dates(listing_id);

ALTER TABLE listing_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view own listing blocked dates"
  ON listing_blocked_dates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Hosts insert own listing blocked dates"
  ON listing_blocked_dates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Hosts update own listing blocked dates"
  ON listing_blocked_dates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.host_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Hosts delete own listing blocked dates"
  ON listing_blocked_dates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Anyone can view blocked dates for published listings"
  ON listing_blocked_dates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_blocked_dates.listing_id
        AND hl.status = 'published'
    )
  );

CREATE POLICY "Stay participants can view listing blocked dates"
  ON listing_blocked_dates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM stay_requests sr
      WHERE sr.listing_id = listing_blocked_dates.listing_id
        AND (sr.traveler_id = (SELECT auth.uid()) OR sr.host_id = (SELECT auth.uid()))
        AND sr.status IN ('pending', 'host_approved', 'approved', 'completed')
    )
  );

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
    AND sr.status = 'approved'
    AND (p_exclude_request_id IS NULL OR sr.id != p_exclude_request_id)
    AND p_start_date < sr.end_date
    AND sr.start_date < p_end_date
  LIMIT 1;

  IF FOUND THEN
    RETURN 'These dates overlap with a confirmed stay.';
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
        CASE WHEN NEW.status = 'approved' THEN NEW.id ELSE NULL END
      );

      IF v_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_error;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stay_requests_enforce_available_dates ON stay_requests;

CREATE TRIGGER stay_requests_enforce_available_dates
  BEFORE INSERT OR UPDATE OF start_date, end_date, status
  ON stay_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_stay_request_available_dates();
