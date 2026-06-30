-- Traveler onboarding: why they want a homestay experience.

ALTER TABLE traveler_profiles
  ADD COLUMN IF NOT EXISTS stay_motivation TEXT;
