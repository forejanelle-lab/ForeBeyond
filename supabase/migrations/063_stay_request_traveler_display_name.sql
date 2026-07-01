-- Snapshot traveler name on stay requests so hosts always see who requested,
-- even when profile visibility or full_name is incomplete.

ALTER TABLE stay_requests
  ADD COLUMN IF NOT EXISTS traveler_display_name TEXT;

UPDATE stay_requests sr
SET traveler_display_name = COALESCE(
  NULLIF(trim(p.full_name), ''),
  NULLIF(
    trim(
      concat(
        COALESCE(u.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(u.raw_user_meta_data->>'last_name', '')
      )
    ),
    ''
  ),
  NULLIF(split_part(p.email, '@', 1), '')
)
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE sr.traveler_id = p.id
  AND (sr.traveler_display_name IS NULL OR trim(sr.traveler_display_name) = '');
