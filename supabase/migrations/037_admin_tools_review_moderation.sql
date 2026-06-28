-- Fore Beyond: admin delete user + low-star review moderation
-- Migration: 037_admin_tools_review_moderation.sql

CREATE OR REPLACE FUNCTION public.auto_moderate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rating <= 3 THEN
    NEW.moderation_status := 'pending';
    NEW.moderated_at := NULL;
    NEW.moderated_by := NULL;
    NEW.moderation_notes := NULL;
  ELSE
    NEW.moderation_status := 'approved';
    NEW.moderated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_moderate_review_trigger ON reviews;
CREATE TRIGGER auto_moderate_review_trigger
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION auto_moderate_review();

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID, p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = p_admin_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID, UUID) TO authenticated;
