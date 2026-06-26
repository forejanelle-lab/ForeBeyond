-- Auto-approve all reviews (no moderation queue)
CREATE OR REPLACE FUNCTION public.auto_moderate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.moderation_status := 'approved';
  NEW.moderated_at := NOW();
  RETURN NEW;
END;
$$;

UPDATE reviews
SET moderation_status = 'approved', moderated_at = COALESCE(moderated_at, NOW())
WHERE moderation_status = 'pending';

-- Verification document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own verification documents storage" ON storage.objects;
CREATE POLICY "Users read own verification documents storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users upload own verification documents storage" ON storage.objects;
CREATE POLICY "Users upload own verification documents storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Admins read verification documents storage" ON storage.objects;
CREATE POLICY "Admins read verification documents storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND public.is_admin(auth.uid())
  );

-- Allow resubmission after rejection
DROP POLICY IF EXISTS "Users can update their own pending verification documents" ON verification_documents;
CREATE POLICY "Users can update their own verification documents"
  ON verification_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
