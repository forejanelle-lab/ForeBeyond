-- Fore Beyond Phase 3: RLS for host listings and photo storage
-- Migration: 007_phase3_listings_rls

ALTER TABLE host_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;

-- Host listings policies
CREATE POLICY "Hosts can view own listings"
  ON host_listings FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert own listings"
  ON host_listings FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own listings"
  ON host_listings FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own listings"
  ON host_listings FOR DELETE
  USING (auth.uid() = host_id);

CREATE POLICY "Authenticated users can view published listings"
  ON host_listings FOR SELECT
  USING (status = 'published' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view published listings"
  ON host_listings FOR SELECT
  USING (status = 'published');

-- Listing photos policies
CREATE POLICY "Anyone can view photos of published listings"
  ON listing_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id
      AND (hl.status = 'published' OR hl.host_id = auth.uid())
    )
  );

CREATE POLICY "Hosts can insert photos for own listings"
  ON listing_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update photos for own listings"
  ON listing_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can delete photos for own listings"
  ON listing_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

-- Storage policies for listing-photos bucket
CREATE POLICY "Public read listing photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

CREATE POLICY "Hosts upload listing photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts update own listing photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts delete own listing photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;

CREATE POLICY "Anyone can view trust badges of published hosts"
  ON trust_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.host_id = trust_badges.user_id AND hl.status = 'published'
    )
  );

CREATE POLICY "Anyone can view reviews of published hosts"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.host_id = reviews.reviewee_id AND hl.status = 'published'
    )
  );
