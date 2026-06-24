-- Fore Beyond Phase 9: Admin Dashboard
-- Migration: 020_phase9_admin_dashboard.sql

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM ('spam', 'harassment', 'fraud', 'inappropriate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_listing_id UUID REFERENCES host_listings(id) ON DELETE SET NULL,
  reported_review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  category report_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  status report_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (
    reported_user_id IS NOT NULL
    OR reported_listing_id IS NOT NULL
    OR reported_review_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at DESC);

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = p_user_id),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_recalculate_trust_score(p_user_id UUID, p_admin_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN calculate_trust_score(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_verification(
  p_document_id UUID,
  p_admin_id UUID,
  p_status verification_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_doc_type document_type;
BEGIN
  IF NOT is_admin(p_admin_id) AND NOT is_trust_moderator(p_admin_id) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE verification_documents
  SET status = p_status, notes = COALESCE(p_notes, notes), reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_document_id
  RETURNING user_id, document_type INTO v_user_id, v_doc_type;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF p_status = 'verified' AND v_doc_type = 'government_id' THEN
    UPDATE profiles SET verification_status = 'verified', updated_at = NOW() WHERE id = v_user_id;
  ELSIF p_status = 'rejected' THEN
    UPDATE profiles SET verification_status = 'rejected', updated_at = NOW() WHERE id = v_user_id;
  END IF;

  PERFORM calculate_trust_score(v_user_id);
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_recalculate_trust_score(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_verification(UUID, UUID, verification_status, TEXT) TO authenticated;
