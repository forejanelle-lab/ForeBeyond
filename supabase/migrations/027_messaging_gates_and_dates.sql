-- Fore Beyond: messaging after host approval, close after stay ends
-- Migration: 027_messaging_gates_and_dates

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
      AND sr.status IN ('host_approved', 'approved')
      AND sr.end_date IS NOT NULL
      AND sr.end_date >= CURRENT_DATE
  );
$$;

CREATE OR REPLACE FUNCTION public.create_conversation_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('host_approved', 'approved')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NEW.status IS DISTINCT FROM OLD.status THEN
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

DROP POLICY IF EXISTS "Approved stay participants can view conversations" ON conversations;
CREATE POLICY "Active stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND stay_messaging_is_open(stay_request_id)
  );

DROP POLICY IF EXISTS "Approved stay participants can view messages" ON stay_messages;
CREATE POLICY "Active stay participants can view messages"
  ON stay_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = stay_messages.conversation_id
        AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
        AND stay_messaging_is_open(c.stay_request_id)
    )
  );

DROP POLICY IF EXISTS "Approved stay participants can send messages" ON stay_messages;
CREATE POLICY "Active stay participants can send messages"
  ON stay_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = stay_messages.conversation_id
        AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
        AND stay_messaging_is_open(c.stay_request_id)
    )
  );

DROP POLICY IF EXISTS "Participants can mark messages read" ON message_reads;
CREATE POLICY "Participants can mark messages read"
  ON message_reads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM stay_messages sm
      JOIN conversations c ON c.id = sm.conversation_id
      WHERE sm.id = message_reads.message_id
        AND stay_messaging_is_open(c.stay_request_id)
        AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
        AND sm.sender_id != auth.uid()
    )
  );
