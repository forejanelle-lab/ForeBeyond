-- Fore Beyond Phase 7: Messaging System (combined setup)
-- Run with: npm run db:phase7

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_request_id UUID NOT NULL UNIQUE REFERENCES stay_requests(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (traveler_id != host_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_traveler ON conversations(traveler_id);
CREATE INDEX IF NOT EXISTS idx_conversations_host ON conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

ALTER TABLE stay_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

ALTER TABLE stay_messages ALTER COLUMN body DROP NOT NULL;

ALTER TABLE stay_messages DROP CONSTRAINT IF EXISTS stay_messages_body_check;
ALTER TABLE stay_messages DROP CONSTRAINT IF EXISTS stay_messages_content_check;
ALTER TABLE stay_messages ADD CONSTRAINT stay_messages_content_check
  CHECK (
    (body IS NOT NULL AND char_length(trim(body)) > 0)
    OR (attachment_url IS NOT NULL AND char_length(trim(attachment_url)) > 0)
  );

ALTER TABLE stay_messages DROP CONSTRAINT IF EXISTS stay_messages_message_type_check;
ALTER TABLE stay_messages ADD CONSTRAINT stay_messages_message_type_check
  CHECK (message_type IN ('text', 'image'));

CREATE INDEX IF NOT EXISTS idx_stay_messages_conversation ON stay_messages(conversation_id);

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES stay_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at);

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversations (stay_request_id, traveler_id, host_id)
SELECT sr.id, sr.traveler_id, sr.host_id
FROM stay_requests sr
WHERE sr.status = 'approved'
ON CONFLICT (stay_request_id) DO NOTHING;

UPDATE stay_messages sm
SET conversation_id = c.id
FROM conversations c
WHERE c.stay_request_id = sm.stay_request_id
  AND sm.conversation_id IS NULL;

CREATE OR REPLACE FUNCTION public.create_conversation_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO conversations (stay_request_id, traveler_id, host_id)
    VALUES (NEW.id, NEW.traveler_id, NEW.host_id)
    ON CONFLICT (stay_request_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_request_approved_conversation ON stay_requests;
CREATE TRIGGER on_stay_request_approved_conversation
  AFTER UPDATE ON stay_requests
  FOR EACH ROW EXECUTE FUNCTION create_conversation_on_approval();

CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.message_type = 'image' THEN '📷 Photo'
      ELSE left(NEW.body, 120)
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_message_update_conversation ON stay_messages;
CREATE TRIGGER on_stay_message_update_conversation
  AFTER INSERT ON stay_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient UUID;
  sender_name TEXT;
  preview TEXT;
  conv conversations%ROWTYPE;
BEGIN
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.sender_id = conv.traveler_id THEN
    recipient := conv.host_id;
  ELSE
    recipient := conv.traveler_id;
  END IF;

  SELECT split_part(full_name, ' ', 1) INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;

  preview := CASE
    WHEN NEW.message_type = 'image' THEN 'Sent a photo'
    ELSE left(NEW.body, 100)
  END;

  INSERT INTO notifications (user_id, type, title, body, link, metadata)
  VALUES (
    recipient,
    'new_message',
    coalesce(sender_name, 'New message'),
    preview,
    '/messages/' || NEW.conversation_id::text,
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_stay_message_notify ON stay_messages;
CREATE TRIGGER on_stay_message_notify
  AFTER INSERT ON stay_messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();

ALTER TABLE stay_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stay_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE stay_messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
  END IF;
END $$;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved stay participants can view conversations" ON conversations;
CREATE POLICY "Approved stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = conversations.stay_request_id AND sr.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "System creates conversations for approved stays" ON conversations;
CREATE POLICY "System creates conversations for approved stays"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = traveler_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

DROP POLICY IF EXISTS "Participants can view message reads" ON message_reads;
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

DROP POLICY IF EXISTS "Participants can mark messages read" ON message_reads;
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

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view message attachments storage" ON storage.objects;
CREATE POLICY "Users can view message attachments storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Participants upload message attachments" ON storage.objects;
CREATE POLICY "Participants upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own message attachments storage" ON storage.objects;
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
