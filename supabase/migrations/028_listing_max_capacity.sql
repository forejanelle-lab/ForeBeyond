-- Fore Beyond: max guest capacity on host listings
-- Migration: 028_listing_max_capacity

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER
    CHECK (max_capacity IS NULL OR max_capacity >= 1);

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
  hl.max_capacity,
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
