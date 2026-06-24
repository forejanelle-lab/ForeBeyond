-- Fore Beyond Phase 3: Host Family Listings
-- Migration: 006_phase3_host_listings

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

CREATE TRIGGER update_host_listings_updated_at
  BEFORE UPDATE ON host_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for listing photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public listing view (no host PII)
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
