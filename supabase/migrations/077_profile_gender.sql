-- Profile gender for hosts and travelers

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IS NULL OR gender IN ('female', 'male', 'non_binary', 'prefer_not_to_say'));

COMMENT ON COLUMN profiles.gender IS 'Self-reported gender; optional for legacy accounts.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gender TEXT;
BEGIN
  v_gender := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'gender', '')), '');

  IF v_gender IS NOT NULL AND v_gender NOT IN ('female', 'male', 'non_binary', 'prefer_not_to_say') THEN
    v_gender := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, gender)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    NULLIF(TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )), ''),
    v_gender
  );
  RETURN NEW;
END;
$$;

-- Backfill known users (remaining accounts stay NULL)
UPDATE profiles
SET gender = 'female', updated_at = NOW()
WHERE gender IS NULL
  AND (
    (full_name ILIKE '%alessandr%' AND full_name ILIKE '%usala%')
    OR full_name ILIKE 'marta p%'
    OR split_part(trim(full_name), ' ', 1) ILIKE 'beatrice'
    OR split_part(trim(full_name), ' ', 1) ILIKE 'yukiko'
    OR split_part(trim(full_name), ' ', 1) ILIKE 'maeyi'
  );

UPDATE profiles
SET gender = 'male', updated_at = NOW()
WHERE gender IS NULL
  AND (
    LOWER(email) = 'tkmcom@ymail.ne.jp'
    OR split_part(trim(full_name), ' ', 1) ILIKE 'unai'
  );
