-- Fore Beyond Phase 4: Search & Favorites
-- Migration: 009_phase4_search_favorites

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS budget_per_night INTEGER CHECK (budget_per_night IS NULL OR budget_per_night >= 0);

CREATE INDEX IF NOT EXISTS idx_host_listings_budget ON host_listings(budget_per_night);

CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES host_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing_id ON saved_listings(listing_id);

DROP VIEW IF EXISTS public_listings;
CREATE VIEW public_listings AS
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
  hl.budget_per_night,
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
