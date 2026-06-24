-- Fore Beyond Phase 5: Experiences Marketplace (combined setup)
-- Run with: npm run db:phase5

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

ALTER TABLE host_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can view own experiences" ON host_experiences;
CREATE POLICY "Hosts can view own experiences"
  ON host_experiences FOR SELECT
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can insert own experiences" ON host_experiences;
CREATE POLICY "Hosts can insert own experiences"
  ON host_experiences FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own experiences" ON host_experiences;
CREATE POLICY "Hosts can update own experiences"
  ON host_experiences FOR UPDATE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own experiences" ON host_experiences;
CREATE POLICY "Hosts can delete own experiences"
  ON host_experiences FOR DELETE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Authenticated users can view published experiences" ON host_experiences;
CREATE POLICY "Authenticated users can view published experiences"
  ON host_experiences FOR SELECT
  USING (status = 'published' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view published experiences" ON host_experiences;
CREATE POLICY "Anyone can view published experiences"
  ON host_experiences FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Anyone can view photos of published experiences" ON experience_photos;
CREATE POLICY "Anyone can view photos of published experiences"
  ON experience_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id
      AND (he.status = 'published' OR he.host_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Hosts can insert photos for own experiences" ON experience_photos;
CREATE POLICY "Hosts can insert photos for own experiences"
  ON experience_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can update photos for own experiences" ON experience_photos;
CREATE POLICY "Hosts can update photos for own experiences"
  ON experience_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can delete photos for own experiences" ON experience_photos;
CREATE POLICY "Hosts can delete photos for own experiences"
  ON experience_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own saved experiences" ON saved_experiences;
CREATE POLICY "Users can view own saved experiences"
  ON saved_experiences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save experiences" ON saved_experiences;
CREATE POLICY "Users can save experiences"
  ON saved_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave experiences" ON saved_experiences;
CREATE POLICY "Users can unsave experiences"
  ON saved_experiences FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Travelers and hosts can view their bookings" ON experience_bookings;
CREATE POLICY "Travelers and hosts can view their bookings"
  ON experience_bookings FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Travelers can create experience bookings" ON experience_bookings;
CREATE POLICY "Travelers can create experience bookings"
  ON experience_bookings FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

DROP POLICY IF EXISTS "Participants can update experience bookings" ON experience_bookings;
CREATE POLICY "Participants can update experience bookings"
  ON experience_bookings FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Public read experience photos storage" ON storage.objects;
CREATE POLICY "Public read experience photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'experience-photos');

DROP POLICY IF EXISTS "Hosts upload experience photos storage" ON storage.objects;
CREATE POLICY "Hosts upload experience photos storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Hosts update own experience photos storage" ON storage.objects;
CREATE POLICY "Hosts update own experience photos storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Hosts delete own experience photos storage" ON storage.objects;
CREATE POLICY "Hosts delete own experience photos storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can view trust badges of published experience hosts" ON trust_badges;
CREATE POLICY "Anyone can view trust badges of published experience hosts"
  ON trust_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.host_id = trust_badges.user_id AND he.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Anyone can view reviews of published experience hosts" ON reviews;
CREATE POLICY "Anyone can view reviews of published experience hosts"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.host_id = reviews.reviewee_id AND he.status = 'published'
    )
  );

GRANT SELECT ON public_experiences TO authenticated;
GRANT SELECT ON public_experiences TO anon;
