-- Fore Beyond: ensure stay conversation exists after host approval
-- Migration: 031_ensure_stay_conversation

CREATE OR REPLACE FUNCTION public.create_conversation_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('host_approved', 'approved')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO conversations (stay_request_id, traveler_id, host_id)
    VALUES (NEW.id, NEW.traveler_id, NEW.host_id)
    ON CONFLICT (stay_request_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO conversations (stay_request_id, traveler_id, host_id)
SELECT sr.id, sr.traveler_id, sr.host_id
FROM stay_requests sr
WHERE sr.status IN ('host_approved', 'approved')
ON CONFLICT (stay_request_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_stay_conversation(p_stay_request_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stay stay_requests%ROWTYPE;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_stay FROM stay_requests WHERE id = p_stay_request_id;
  IF NOT FOUND OR v_stay.status NOT IN ('host_approved', 'approved') THEN
    RETURN NULL;
  END IF;

  INSERT INTO conversations (stay_request_id, traveler_id, host_id)
  VALUES (v_stay.id, v_stay.traveler_id, v_stay.host_id)
  ON CONFLICT (stay_request_id) DO NOTHING;

  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE stay_request_id = p_stay_request_id;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_stay_conversation(UUID) TO authenticated;
