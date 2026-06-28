-- Travelers can only message after the host approves or sends the first message.

CREATE OR REPLACE FUNCTION public.stay_host_can_message(
  p_stay_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM stay_requests sr
    JOIN conversations c ON c.stay_request_id = sr.id
    WHERE sr.id = p_stay_request_id
      AND c.host_id = p_user_id
      AND sr.status IN ('pending', 'host_approved', 'approved')
      AND sr.end_date IS NOT NULL
      AND sr.end_date >= CURRENT_DATE
  );
$$;

CREATE OR REPLACE FUNCTION public.stay_traveler_can_message(
  p_stay_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM stay_requests sr
    JOIN conversations c ON c.stay_request_id = sr.id
    WHERE sr.id = p_stay_request_id
      AND c.traveler_id = p_user_id
      AND sr.end_date IS NOT NULL
      AND sr.end_date >= CURRENT_DATE
      AND (
        sr.status IN ('host_approved', 'approved')
        OR (
          sr.status = 'pending'
          AND EXISTS (
            SELECT 1
            FROM stay_messages sm
            WHERE sm.stay_request_id = sr.id
              AND sm.sender_id = c.host_id
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.stay_participant_can_view_conversation(
  p_stay_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stay_host_can_message(p_stay_request_id, p_user_id)
      OR stay_traveler_can_message(p_stay_request_id, p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.stay_participant_can_send_message(
  p_stay_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stay_host_can_message(p_stay_request_id, p_user_id)
      OR stay_traveler_can_message(p_stay_request_id, p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.stay_messaging_is_open(p_stay_request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT stay_participant_can_view_conversation(p_stay_request_id, auth.uid());
$$;

DROP POLICY IF EXISTS "Active stay participants can view conversations" ON conversations;
CREATE POLICY "Active stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND stay_participant_can_view_conversation(stay_request_id, auth.uid())
  );

DROP POLICY IF EXISTS "Active stay participants can view messages" ON stay_messages;
CREATE POLICY "Active stay participants can view messages"
  ON stay_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = stay_messages.conversation_id
        AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
        AND stay_participant_can_view_conversation(c.stay_request_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Active stay participants can send messages" ON stay_messages;
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
        AND stay_participant_can_send_message(c.stay_request_id, auth.uid())
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
        AND stay_participant_can_view_conversation(c.stay_request_id, auth.uid())
        AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
        AND sm.sender_id != auth.uid()
    )
  );
