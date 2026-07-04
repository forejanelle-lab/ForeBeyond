-- Published listings should appear in search and on profile pages even when
-- the host has not flipped profiles.onboarding_complete yet.

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
  hp.host_motivation
FROM host_listings hl
JOIN profiles p ON p.id = hl.host_id
LEFT JOIN host_profiles hp ON hp.user_id = hl.host_id
WHERE hl.status = 'published';

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;

NOTIFY pgrst, 'reload schema';
