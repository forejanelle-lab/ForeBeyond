-- Allow marketplace visitors to see completed stays on published listings
-- (matches public visibility of approved traveler reviews).

DROP POLICY IF EXISTS "Anyone can view completed trips on published listings" ON trips;
CREATE POLICY "Anyone can view completed trips on published listings"
  ON trips FOR SELECT
  USING (
    status = 'completed'
    AND listing_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM host_listings hl
      JOIN profiles p ON p.id = hl.host_id
      WHERE hl.id = trips.listing_id
        AND hl.status = 'published'
        AND p.onboarding_complete = TRUE
    )
  );
