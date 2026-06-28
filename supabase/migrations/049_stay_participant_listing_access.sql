-- Travelers and hosts can read listing details for active stay requests,
-- even when a listing is temporarily unpublished (needed to confirm pricing).

CREATE POLICY "Stay participants can view request listing"
  ON host_listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM stay_requests sr
      WHERE sr.listing_id = host_listings.id
        AND (sr.traveler_id = auth.uid() OR sr.host_id = auth.uid())
        AND sr.status IN ('pending', 'host_approved', 'approved', 'completed')
    )
  );
