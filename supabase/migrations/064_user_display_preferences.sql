-- User display preferences: currency and translation target language
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_default_currency_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_currency_check
  CHECK (default_currency ~ '^[A-Z]{3}$');

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$');
