-- Household composition and preferred guest gender on host listings

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS household_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_guest_gender TEXT NOT NULL DEFAULT 'all';

ALTER TABLE host_listings
  DROP CONSTRAINT IF EXISTS host_listings_preferred_guest_gender_check;

ALTER TABLE host_listings
  ADD CONSTRAINT host_listings_preferred_guest_gender_check
  CHECK (preferred_guest_gender IN ('female', 'male', 'all'));

ALTER TABLE host_listings
  DROP CONSTRAINT IF EXISTS host_listings_household_members_array_check;

ALTER TABLE host_listings
  ADD CONSTRAINT host_listings_household_members_array_check
  CHECK (jsonb_typeof(household_members) = 'array');

COMMENT ON COLUMN host_listings.household_members IS
  'Household members as [{label, gender, age_group}] where gender is female or male and age_group is adult, teen, or child (0-18).';
COMMENT ON COLUMN host_listings.preferred_guest_gender IS
  'Host preference for guest gender: female, male, or all.';

DROP VIEW IF EXISTS public_listings;
CREATE VIEW public_listings AS
SELECT
  hl.id,
  hl.host_id,
  hl.title,
  hl.family_story,
  hl.stay_details,
  hl.intro_video_url,
  hl.languages,
  hl.country,
  hl.city,
  hl.meals,
  hl.amenities,
  hl.family_activities,
  hl.house_rules,
  hl.household_members,
  hl.preferred_guest_gender,
  hl.budget_per_night,
  hl.budget_per_night_3_guests,
  hl.budget_per_night_4_guests,
  hl.budget_per_night_5_guests,
  hl.budget_per_night_6_plus_guests,
  hl.pricing_currency,
  hl.max_capacity,
  hl.published_at,
  hl.created_at,
  p.trust_score,
  p.trust_score_breakdown,
  p.profile_completion,
  p.verification_status,
  split_part(p.full_name, ' ', 1) AS host_first_name,
  NULLIF(trim(p.avatar_url), '') AS host_avatar_url,
  hp.host_motivation
FROM host_listings hl
JOIN profiles p ON p.id = hl.host_id
LEFT JOIN host_profiles hp ON hp.user_id = hl.host_id
WHERE hl.status = 'published';

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;

-- Default guest preference: all hosts welcome all guests, except 知博's Family (women).
UPDATE host_listings
SET preferred_guest_gender = 'all';

UPDATE host_listings hl
SET preferred_guest_gender = 'female'
FROM profiles p
WHERE hl.host_id = p.id
  AND (
    hl.id = 'f80382ba-304c-4f11-a942-3c21050c8718'
    OR p.full_name ILIKE '%知博%'
    OR p.full_name ILIKE '%zhibo%'
    OR p.full_name ILIKE '%zuribo%'
    OR COALESCE(p.email, '') ILIKE '%tkmcom%'
    OR COALESCE(hl.title, '') ILIKE '%知博%'
    OR COALESCE(hl.title, '') ILIKE '%zhibo%'
    OR COALESCE(hl.title, '') ILIKE '%zuribo%'
  );

NOTIFY pgrst, 'reload schema';
