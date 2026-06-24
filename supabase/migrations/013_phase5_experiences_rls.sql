-- Fore Beyond Phase 5: RLS for experiences marketplace
-- Migration: 013_phase5_experiences_rls

ALTER TABLE host_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view own experiences"
  ON host_experiences FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert own experiences"
  ON host_experiences FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own experiences"
  ON host_experiences FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete own experiences"
  ON host_experiences FOR DELETE
  USING (auth.uid() = host_id);

CREATE POLICY "Authenticated users can view published experiences"
  ON host_experiences FOR SELECT
  USING (status = 'published' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view published experiences"
  ON host_experiences FOR SELECT
  USING (status = 'published');

CREATE POLICY "Anyone can view photos of published experiences"
  ON experience_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id
      AND (he.status = 'published' OR he.host_id = auth.uid())
    )
  );

CREATE POLICY "Hosts can insert photos for own experiences"
  ON experience_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update photos for own experiences"
  ON experience_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can delete photos for own experiences"
  ON experience_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.id = experience_photos.experience_id AND he.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own saved experiences"
  ON saved_experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save experiences"
  ON saved_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave experiences"
  ON saved_experiences FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Travelers and hosts can view their bookings"
  ON experience_bookings FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Travelers can create experience bookings"
  ON experience_bookings FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Participants can update experience bookings"
  ON experience_bookings FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Public read experience photos storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'experience-photos');

CREATE POLICY "Hosts upload experience photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts update own experience photos storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Hosts delete own experience photos storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'experience-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can view trust badges of published experience hosts"
  ON trust_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_experiences he
      WHERE he.host_id = trust_badges.user_id AND he.status = 'published'
    )
  );

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
