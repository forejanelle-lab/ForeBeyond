-- Allow guest and partnership inquiries in support_requests

DO $$ BEGIN
  CREATE TYPE support_request_source AS ENUM ('member', 'partnership', 'contact');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE support_requests
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE support_requests
  ADD COLUMN IF NOT EXISTS source support_request_source NOT NULL DEFAULT 'member';

CREATE INDEX IF NOT EXISTS idx_support_requests_source ON support_requests(source);
