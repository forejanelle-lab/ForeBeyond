-- AI social media posts (Instagram v1; platform column for future channels)

DO $$ BEGIN
  CREATE TYPE social_platform AS ENUM ('instagram', 'facebook', 'linkedin', 'pinterest', 'tiktok');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE social_post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform social_platform NOT NULL DEFAULT 'instagram',
  image_url TEXT,
  image_prompt TEXT,
  caption TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  theme TEXT,
  goal TEXT,
  tone TEXT,
  strategy_week INTEGER,
  strategy_topic TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status social_post_status NOT NULL DEFAULT 'draft',
  approved BOOLEAN NOT NULL DEFAULT false,
  publish_error TEXT,
  platform_media_id TEXT,
  platform_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts (status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts (scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts (platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts (created_at DESC);

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view social posts" ON social_posts;
CREATE POLICY "Admins can view social posts"
  ON social_posts FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert social posts" ON social_posts;
CREATE POLICY "Admins can insert social posts"
  ON social_posts FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update social posts" ON social_posts;
CREATE POLICY "Admins can update social posts"
  ON social_posts FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete social posts" ON social_posts;
CREATE POLICY "Admins can delete social posts"
  ON social_posts FOR DELETE
  USING (is_admin(auth.uid()));

-- Public bucket for generated Instagram images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media',
  'social-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read social media images" ON storage.objects;
CREATE POLICY "Public read social media images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social-media');

DROP POLICY IF EXISTS "Admins upload social media images" ON storage.objects;
CREATE POLICY "Admins upload social media images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-media'
    AND is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins update social media images" ON storage.objects;
CREATE POLICY "Admins update social media images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'social-media'
    AND is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins delete social media images" ON storage.objects;
CREATE POLICY "Admins delete social media images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-media'
    AND is_admin(auth.uid())
  );

NOTIFY pgrst, 'reload schema';
