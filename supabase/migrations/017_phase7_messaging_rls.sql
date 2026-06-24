-- Fore Beyond Phase 7: RLS for messaging system
-- Migration: 017_phase7_messaging_rls

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = conversations.stay_request_id AND sr.status = 'approved'
    )
  );

CREATE POLICY "System creates conversations for approved stays"
  ON conversations FOR INSERT
  WITH CHECK (
    auth.uid() = traveler_id OR auth.uid() = host_id
  );

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Participants can view message reads"
  ON message_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stay_messages sm
      JOIN conversations c ON c.id = sm.conversation_id
      WHERE sm.id = message_reads.message_id
      AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

CREATE POLICY "Participants can mark messages read"
  ON message_reads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM stay_messages sm
      JOIN conversations c ON c.id = sm.conversation_id
      JOIN stay_requests sr ON sr.id = c.stay_request_id
      WHERE sm.id = message_reads.message_id
      AND sr.status = 'approved'
      AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
      AND sm.sender_id != auth.uid()
    )
  );

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view message attachments storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Participants upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own message attachments storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Approved stay participants can send messages" ON stay_messages;
CREATE POLICY "Approved stay participants can send messages"
  ON stay_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN stay_requests sr ON sr.id = c.stay_request_id
      WHERE c.id = stay_messages.conversation_id
      AND sr.status = 'approved'
      AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
    )
  );
