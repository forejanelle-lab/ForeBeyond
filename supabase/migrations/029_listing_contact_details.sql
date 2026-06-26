-- Fore Beyond: private host contact details per listing (revealed after booking)
-- Migration: 029_listing_contact_details

CREATE TABLE IF NOT EXISTS listing_contact_details (
  listing_id UUID PRIMARY KEY REFERENCES host_listings(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE listing_contact_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts manage own listing contact details" ON listing_contact_details;
CREATE POLICY "Hosts manage own listing contact details"
  ON listing_contact_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_contact_details.listing_id
        AND hl.host_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_contact_details.listing_id
        AND hl.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Travelers view contact after booking" ON listing_contact_details;
CREATE POLICY "Travelers view contact after booking"
  ON listing_contact_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.listing_id = listing_contact_details.listing_id
        AND sr.traveler_id = auth.uid()
        AND sr.status IN ('approved', 'completed')
    )
    OR EXISTS (
      SELECT 1 FROM trips t
      WHERE t.listing_id = listing_contact_details.listing_id
        AND t.traveler_id = auth.uid()
        AND t.status IN ('upcoming', 'active', 'completed')
    )
  );

DROP TRIGGER IF EXISTS update_listing_contact_details_updated_at ON listing_contact_details;
CREATE TRIGGER update_listing_contact_details_updated_at
  BEFORE UPDATE ON listing_contact_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
