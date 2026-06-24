-- Fore Beyond Phase 6: RLS for stay request flow
-- Migration: 015_phase6_stay_request_rls

ALTER TABLE stay_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view stay bookings"
  ON stay_bookings FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "System creates stay bookings via participants"
  ON stay_bookings FOR INSERT
  WITH CHECK (auth.uid() = host_id OR auth.uid() = traveler_id);

CREATE POLICY "Participants can update stay bookings"
  ON stay_bookings FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id);

CREATE POLICY "Approved stay participants can view messages"
  ON stay_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = stay_messages.stay_request_id
      AND sr.status = 'approved'
      AND (sr.traveler_id = auth.uid() OR sr.host_id = auth.uid())
    )
  );

CREATE POLICY "Approved stay participants can send messages"
  ON stay_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = stay_messages.stay_request_id
      AND sr.status = 'approved'
      AND (sr.traveler_id = auth.uid() OR sr.host_id = auth.uid())
    )
  );
