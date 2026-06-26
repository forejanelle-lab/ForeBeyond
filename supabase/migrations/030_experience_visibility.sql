-- Fore Beyond: experience visibility — all members vs approved guests only
-- Migration: 030_experience_visibility

DO $$ BEGIN
  CREATE TYPE experience_visibility AS ENUM ('all_members', 'approved_guests_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE host_experiences
  ADD COLUMN IF NOT EXISTS visibility experience_visibility NOT NULL DEFAULT 'all_members';

DROP VIEW IF EXISTS public_experiences;
CREATE VIEW public_experiences AS
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
WHERE he.status = 'published'
  AND p.onboarding_complete = TRUE;
