-- Listing intro video (30s max, enforced client-side) and host motivation for onboarding.

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

ALTER TABLE host_profiles
  ADD COLUMN IF NOT EXISTS host_motivation TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-videos',
  'listing-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read listing videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-videos');

CREATE POLICY "Hosts upload listing videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts update own listing videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts delete own listing videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

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
  hl.max_capacity,
  hl.published_at,
  hl.created_at,
  p.trust_score,
  p.profile_completion,
  p.verification_status,
  split_part(p.full_name, ' ', 1) AS host_first_name,
  hp.host_motivation
FROM host_listings hl
JOIN profiles p ON p.id = hl.host_id
LEFT JOIN host_profiles hp ON hp.user_id = hl.host_id
WHERE hl.status = 'published'
  AND p.onboarding_complete = TRUE;
