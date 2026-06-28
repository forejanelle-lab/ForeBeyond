-- Fore Beyond: allow verification resubmission after admin rejection
-- Migration: 039_verification_resubmit_after_rejection.sql

DROP POLICY IF EXISTS "Users can update their own pending verification documents" ON verification_documents;
DROP POLICY IF EXISTS "Users can update their own verification documents" ON verification_documents;

CREATE POLICY "Users can update their own verification documents"
  ON verification_documents FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('unverified', 'pending', 'in_review', 'rejected')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'unverified')
  );

CREATE OR REPLACE FUNCTION public.sync_profile_verification_on_resubmit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    UPDATE profiles
    SET verification_status = 'pending', updated_at = NOW()
    WHERE id = NEW.user_id
      AND verification_status = 'rejected';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_verification_on_resubmit ON verification_documents;
CREATE TRIGGER sync_profile_verification_on_resubmit
  AFTER UPDATE ON verification_documents
  FOR EACH ROW
  WHEN (OLD.status = 'rejected' AND NEW.status = 'pending')
  EXECUTE FUNCTION public.sync_profile_verification_on_resubmit();

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
  SET
    status = p_status,
    notes = COALESCE(p_notes, notes),
    reviewed_at = NOW(),
    updated_at = NOW()
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
