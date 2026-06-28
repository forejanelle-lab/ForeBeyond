-- Fore Beyond: show published experiences in marketplace without onboarding gate
-- Migration: 032_public_experiences_marketplace.sql

DROP VIEW IF EXISTS public_experiences;
CREATE VIEW public_experiences
WITH (security_invoker = false)
AS
SELECT
  he.id,
  he.host_id,
  he.title,
  he.description,
  he.category,
  he.languages,
  he.country,
  he.city,
  he.meeting_point,
  he.duration_minutes,
  he.max_guests,
  he.price_per_person,
  he.includes,
  he.requirements,
  he.visibility,
  he.published_at,
  he.created_at,
  p.trust_score,
  p.profile_completion,
  p.verification_status,
  split_part(p.full_name, ' ', 1) AS host_first_name
FROM host_experiences he
JOIN profiles p ON p.id = he.host_id
WHERE he.status = 'published';

GRANT SELECT ON public_experiences TO authenticated;
GRANT SELECT ON public_experiences TO anon;
