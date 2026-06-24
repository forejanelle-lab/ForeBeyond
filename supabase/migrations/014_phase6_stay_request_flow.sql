-- Fore Beyond Phase 6: Request Stay Flow
-- Migration: 014_phase6_stay_request_flow

ALTER TABLE stay_requests
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES host_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1 CHECK (guest_count > 0),
  ADD COLUMN IF NOT EXISTS host_response TEXT;

CREATE INDEX IF NOT EXISTS idx_stay_requests_listing ON stay_requests(listing_id);

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES host_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE trips ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN completed_at DROP DEFAULT;
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'upcoming';

DO $$ BEGIN
  CREATE TYPE booking_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS stay_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_request_id UUID NOT NULL REFERENCES stay_requests(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES host_listings(id) ON DELETE SET NULL,
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guest_count INTEGER DEFAULT 1 CHECK (guest_count > 0),
  nightly_rate INTEGER CHECK (nightly_rate IS NULL OR nightly_rate >= 0),
  total_amount INTEGER CHECK (total_amount IS NULL OR total_amount >= 0),
  payment_status booking_payment_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (stay_request_id)
);

CREATE TABLE IF NOT EXISTS stay_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stay_request_id UUID NOT NULL REFERENCES stay_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stay_bookings_traveler ON stay_bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_stay_bookings_host ON stay_bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_stay_bookings_trip ON stay_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_stay_messages_request ON stay_messages(stay_request_id);

DROP TRIGGER IF EXISTS update_stay_bookings_updated_at ON stay_bookings;
CREATE TRIGGER update_stay_bookings_updated_at
  BEFORE UPDATE ON stay_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
