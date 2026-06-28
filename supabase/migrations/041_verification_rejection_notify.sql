-- Notify members when a verification document is rejected (profile stays "rejected" in DB = incomplete in UI).

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
  v_doc_label TEXT;
  v_note TEXT;
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

  PERFORM sync_profile_verification_status(v_user_id);

  IF p_status = 'rejected' AND v_doc_type <> 'background_check' THEN
    v_doc_label := replace(v_doc_type::text, '_', ' ');
    v_note := COALESCE(
      NULLIF(TRIM(p_notes), ''),
      'Please open Verification Center to review and resubmit.'
    );

    INSERT INTO notifications (user_id, type, title, body, link, metadata)
    VALUES (
      v_user_id,
      'verification_rejected',
      'Verification incomplete',
      format('Your %s needs to be updated. %s', v_doc_label, v_note),
      '/verification-center',
      jsonb_build_object(
        'document_type', v_doc_type,
        'document_id', p_document_id,
        'admin_notes', p_notes
      )
    );
  END IF;

  PERFORM calculate_trust_score(v_user_id);
  RETURN TRUE;
END;
$$;
