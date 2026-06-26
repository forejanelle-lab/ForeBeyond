-- Fore Beyond: tiered listing pricing by guest count
-- Migration: 026_listing_guest_tier_pricing

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS budget_per_night_3_guests NUMERIC(10, 2)
    CHECK (budget_per_night_3_guests IS NULL OR budget_per_night_3_guests >= 0),
  ADD COLUMN IF NOT EXISTS budget_per_night_4_guests NUMERIC(10, 2)
    CHECK (budget_per_night_4_guests IS NULL OR budget_per_night_4_guests >= 0),
  ADD COLUMN IF NOT EXISTS budget_per_night_5_guests NUMERIC(10, 2)
    CHECK (budget_per_night_5_guests IS NULL OR budget_per_night_5_guests >= 0),
  ADD COLUMN IF NOT EXISTS budget_per_night_6_plus_guests NUMERIC(10, 2)
    CHECK (budget_per_night_6_plus_guests IS NULL OR budget_per_night_6_plus_guests >= 0);

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
  hl.budget_per_night_3_guests,
  hl.budget_per_night_4_guests,
  hl.budget_per_night_5_guests,
  hl.budget_per_night_6_plus_guests,
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
