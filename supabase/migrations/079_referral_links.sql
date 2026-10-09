-- Admin-created referral links attributed onto stay requests and bookings

CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_links_name_not_blank CHECK (char_length(trim(name)) >= 1),
  CONSTRAINT referral_links_code_format CHECK (
    code ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
    AND char_length(code) BETWEEN 2 AND 48
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_links_code
  ON referral_links (code);

CREATE INDEX IF NOT EXISTS idx_referral_links_created
  ON referral_links (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_links_active
  ON referral_links (is_active)
  WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS update_referral_links_updated_at ON referral_links;
CREATE TRIGGER update_referral_links_updated_at
  BEFORE UPDATE ON referral_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE stay_requests
  ADD COLUMN IF NOT EXISTS referral_link_id UUID REFERENCES referral_links(id) ON DELETE SET NULL;

ALTER TABLE stay_bookings
  ADD COLUMN IF NOT EXISTS referral_link_id UUID REFERENCES referral_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stay_requests_referral_link
  ON stay_requests (referral_link_id)
  WHERE referral_link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stay_bookings_referral_link
  ON stay_bookings (referral_link_id)
  WHERE referral_link_id IS NOT NULL;

COMMENT ON TABLE referral_links IS
  'Admin-created referral partners. Public codes are used in /?ref= and /r/{code} links.';
COMMENT ON COLUMN stay_requests.referral_link_id IS
  'Referral link present when the traveler submitted this stay request.';
COMMENT ON COLUMN stay_bookings.referral_link_id IS
  'Referral link copied from the stay request when the booking was confirmed.';

CREATE OR REPLACE FUNCTION public.validate_stay_request_referral_link()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_link_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM referral_links
    WHERE id = NEW.referral_link_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive referral link';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_stay_request_referral_link ON stay_requests;
CREATE TRIGGER validate_stay_request_referral_link
  BEFORE INSERT ON stay_requests
  FOR EACH ROW EXECUTE FUNCTION validate_stay_request_referral_link();

CREATE OR REPLACE FUNCTION public.freeze_referral_link_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.referral_link_id IS NOT NULL
     AND NEW.referral_link_id IS DISTINCT FROM OLD.referral_link_id THEN
    NEW.referral_link_id := OLD.referral_link_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS freeze_stay_request_referral_link ON stay_requests;
CREATE TRIGGER freeze_stay_request_referral_link
  BEFORE UPDATE ON stay_requests
  FOR EACH ROW EXECUTE FUNCTION freeze_referral_link_id();

DROP TRIGGER IF EXISTS freeze_stay_booking_referral_link ON stay_bookings;
CREATE TRIGGER freeze_stay_booking_referral_link
  BEFORE UPDATE ON stay_bookings
  FOR EACH ROW EXECUTE FUNCTION freeze_referral_link_id();

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active referral links" ON referral_links;
CREATE POLICY "Anyone can view active referral links"
  ON referral_links FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can view all referral links" ON referral_links;
CREATE POLICY "Admins can view all referral links"
  ON referral_links FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert referral links" ON referral_links;
CREATE POLICY "Admins can insert referral links"
  ON referral_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update referral links" ON referral_links;
CREATE POLICY "Admins can update referral links"
  ON referral_links FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete referral links" ON referral_links;
CREATE POLICY "Admins can delete referral links"
  ON referral_links FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all stay requests" ON stay_requests;
CREATE POLICY "Admins can view all stay requests"
  ON stay_requests FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all stay bookings" ON stay_bookings;
CREATE POLICY "Admins can view all stay bookings"
  ON stay_bookings FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

GRANT SELECT ON referral_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON referral_links TO authenticated;
GRANT ALL ON TABLE referral_links TO service_role;
