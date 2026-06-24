-- Fore Beyond Phase 5: Experiences Marketplace
-- Migration: 012_phase5_experiences_marketplace

DO $$ BEGIN
  CREATE TYPE experience_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE experience_category AS ENUM (
    'family_dinner',
    'cooking_class',
    'market_tour',
    'tea_ceremony',
    'cultural_workshop',
    'hiking'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE experience_booking_status AS ENUM (
    'pending', 'confirmed', 'declined', 'cancelled', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS host_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  category experience_category NOT NULL,
  languages TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  meeting_point TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  max_guests INTEGER DEFAULT 4 CHECK (max_guests > 0),
  price_per_person INTEGER CHECK (price_per_person IS NULL OR price_per_person >= 0),
  includes TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  status experience_status DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS experience_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES host_experiences(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES host_experiences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, experience_id)
);

CREATE TABLE IF NOT EXISTS experience_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES host_experiences(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status experience_booking_status DEFAULT 'pending' NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  guest_count INTEGER DEFAULT 1 CHECK (guest_count > 0),
  message TEXT,
  total_price INTEGER CHECK (total_price IS NULL OR total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (traveler_id != host_id)
);

CREATE INDEX IF NOT EXISTS idx_host_experiences_host_id ON host_experiences(host_id);
CREATE INDEX IF NOT EXISTS idx_host_experiences_status ON host_experiences(status);
CREATE INDEX IF NOT EXISTS idx_host_experiences_category ON host_experiences(category);
CREATE INDEX IF NOT EXISTS idx_host_experiences_country_city ON host_experiences(country, city);
CREATE INDEX IF NOT EXISTS idx_experience_photos_experience_id ON experience_photos(experience_id);
CREATE INDEX IF NOT EXISTS idx_saved_experiences_user_id ON saved_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_experience_id ON experience_bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_traveler ON experience_bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_experience_bookings_host ON experience_bookings(host_id);

DROP TRIGGER IF EXISTS update_host_experiences_updated_at ON host_experiences;
CREATE TRIGGER update_host_experiences_updated_at
  BEFORE UPDATE ON host_experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experience_bookings_updated_at ON experience_bookings;
CREATE TRIGGER update_experience_bookings_updated_at
  BEFORE UPDATE ON experience_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'experience-photos',
  'experience-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

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
