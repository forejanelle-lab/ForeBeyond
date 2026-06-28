-- Stay request guest photos (uploaded during request flow)
CREATE TABLE IF NOT EXISTS stay_request_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_request_id UUID NOT NULL REFERENCES stay_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stay_request_photos_request
  ON stay_request_photos(stay_request_id);

ALTER TABLE stay_request_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view stay request photos" ON stay_request_photos;
CREATE POLICY "Participants can view stay request photos"
  ON stay_request_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = stay_request_photos.stay_request_id
        AND (sr.traveler_id = auth.uid() OR sr.host_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Travelers can insert stay request photos" ON stay_request_photos;
CREATE POLICY "Travelers can insert stay request photos"
  ON stay_request_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = stay_request_photos.stay_request_id
        AND sr.traveler_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Travelers can delete own stay request photos" ON stay_request_photos;
CREATE POLICY "Travelers can delete own stay request photos"
  ON stay_request_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = stay_request_photos.stay_request_id
        AND sr.traveler_id = auth.uid()
        AND sr.status = 'pending'
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stay-request-photos',
  'stay-request-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read stay request photos" ON storage.objects;
CREATE POLICY "Public read stay request photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stay-request-photos');

DROP POLICY IF EXISTS "Travelers upload stay request photos" ON storage.objects;
CREATE POLICY "Travelers upload stay request photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stay-request-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Travelers delete own stay request photos storage" ON storage.objects;
CREATE POLICY "Travelers delete own stay request photos storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stay-request-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
