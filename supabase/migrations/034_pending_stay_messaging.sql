-- Allow messaging on pending stay requests (host can message before approval)

CREATE OR REPLACE FUNCTION public.stay_messaging_is_open(p_stay_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM stay_requests sr
    WHERE sr.id = p_stay_request_id
      AND sr.status IN ('pending', 'host_approved', 'approved')
      AND sr.end_date IS NOT NULL
      AND sr.end_date >= CURRENT_DATE
  );
$$;

CREATE OR REPLACE FUNCTION public.create_conversation_on_stay_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO conversations (stay_request_id, traveler_id, host_id)
  VALUES (NEW.id, NEW.traveler_id, NEW.host_id)
  ON CONFLICT (stay_request_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_request_created_conversation ON stay_requests;
CREATE TRIGGER on_stay_request_created_conversation
  AFTER INSERT ON stay_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_conversation_on_stay_request();

INSERT INTO conversations (stay_request_id, traveler_id, host_id)
SELECT sr.id, sr.traveler_id, sr.host_id
FROM stay_requests sr
WHERE sr.status = 'pending'
  AND sr.end_date IS NOT NULL
  AND sr.end_date >= CURRENT_DATE
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
  IF NOT FOUND
     OR v_stay.status NOT IN ('pending', 'host_approved', 'approved')
     OR v_stay.end_date IS NULL
     OR v_stay.end_date < CURRENT_DATE THEN
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
