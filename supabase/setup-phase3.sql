-- Fore Beyond Phase 3: Host Family Listings (combined setup)
-- Run with: npm run db:phase3

-- Migration 006
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS host_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  family_story TEXT,
  languages TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  meals TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  family_activities TEXT[] DEFAULT '{}',
  house_rules TEXT[] DEFAULT '{}',
  status listing_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES host_listings(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_host_listings_host_id ON host_listings(host_id);
CREATE INDEX IF NOT EXISTS idx_host_listings_status ON host_listings(status);
CREATE INDEX IF NOT EXISTS idx_host_listings_country_city ON host_listings(country, city);
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing_id ON listing_photos(listing_id);

DROP TRIGGER IF EXISTS update_host_listings_updated_at ON host_listings;
CREATE TRIGGER update_host_listings_updated_at
  BEFORE UPDATE ON host_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE VIEW public_listings AS
SELECT
  hl.id,
  hl.host_id,
  hl.title,
  hl.family_story,
  hl.languages,
  hl.country,
  hl.city,
  hl.meals,
  hl.amenities,
  hl.family_activities,
  hl.house_rules,
  hl.published_at,
  hl.created_at,
  p.trust_score,
  p.profile_completion,
  p.verification_status,
  split_part(p.full_name, ' ', 1) AS host_first_name
FROM host_listings hl
JOIN profiles p ON p.id = hl.host_id
WHERE hl.status = 'published'
  AND p.onboarding_complete = TRUE;

-- Migration 007
ALTER TABLE host_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can view own listings" ON host_listings;
CREATE POLICY "Hosts can view own listings"
  ON host_listings FOR SELECT
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can insert own listings" ON host_listings;
CREATE POLICY "Hosts can insert own listings"
  ON host_listings FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own listings" ON host_listings;
CREATE POLICY "Hosts can update own listings"
  ON host_listings FOR UPDATE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own listings" ON host_listings;
CREATE POLICY "Hosts can delete own listings"
  ON host_listings FOR DELETE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Authenticated users can view published listings" ON host_listings;
CREATE POLICY "Authenticated users can view published listings"
  ON host_listings FOR SELECT
  USING (status = 'published' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view published listings" ON host_listings;
CREATE POLICY "Anyone can view published listings"
  ON host_listings FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Anyone can view photos of published listings" ON listing_photos;
CREATE POLICY "Anyone can view photos of published listings"
  ON listing_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id
      AND (hl.status = 'published' OR hl.host_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Hosts can insert photos for own listings" ON listing_photos;
CREATE POLICY "Hosts can insert photos for own listings"
  ON listing_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can update photos for own listings" ON listing_photos;
CREATE POLICY "Hosts can update photos for own listings"
  ON listing_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can delete photos for own listings" ON listing_photos;
CREATE POLICY "Hosts can delete photos for own listings"
  ON listing_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.id = listing_photos.listing_id AND hl.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public read listing photos" ON storage.objects;
CREATE POLICY "Public read listing photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS "Hosts upload listing photos" ON storage.objects;
CREATE POLICY "Hosts upload listing photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Hosts update own listing photos" ON storage.objects;
CREATE POLICY "Hosts update own listing photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Hosts delete own listing photos" ON storage.objects;
CREATE POLICY "Hosts delete own listing photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;

DROP POLICY IF EXISTS "Anyone can view trust badges of published hosts" ON trust_badges;
CREATE POLICY "Anyone can view trust badges of published hosts"
  ON trust_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.host_id = trust_badges.user_id AND hl.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Anyone can view reviews of published hosts" ON reviews;
CREATE POLICY "Anyone can view reviews of published hosts"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_listings hl
      WHERE hl.host_id = reviews.reviewee_id AND hl.status = 'published'
    )
  );
