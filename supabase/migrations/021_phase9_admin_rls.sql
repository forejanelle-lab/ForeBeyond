-- Fore Beyond Phase 9: Admin RLS
-- Migration: 021_phase9_admin_rls.sql

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);

DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
CREATE POLICY "Admins can view all reports"
  ON content_reports FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
CREATE POLICY "Admins can update reports"
  ON content_reports FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all listings" ON host_listings;
CREATE POLICY "Admins can view all listings"
  ON host_listings FOR SELECT
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update listings" ON host_listings;
CREATE POLICY "Admins can update listings"
  ON host_listings FOR UPDATE
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all verification documents" ON verification_documents;
CREATE POLICY "Admins can view all verification documents"
  ON verification_documents FOR SELECT
  USING (is_admin(auth.uid()) OR is_trust_moderator(auth.uid()));

DROP POLICY IF EXISTS "Admins can update verification documents" ON verification_documents;
CREATE POLICY "Admins can update verification documents"
  ON verification_documents FOR UPDATE
  USING (is_admin(auth.uid()) OR is_trust_moderator(auth.uid()));

DROP POLICY IF EXISTS "Admins can moderate all reviews" ON reviews;
CREATE POLICY "Admins can moderate all reviews"
  ON reviews FOR UPDATE
  USING (is_admin(auth.uid()) OR is_trust_moderator(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (is_admin(auth.uid()));
