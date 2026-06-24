-- Fore Beyond Phase 8: RLS for review system and trip completion
-- Migration: 019_phase8_review_rls.sql

DROP POLICY IF EXISTS "Users can view reviews about them or by them" ON reviews;
DROP POLICY IF EXISTS "Participants can create reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews of published hosts" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews of published experience hosts" ON reviews;

CREATE POLICY "Users can view own and approved reviews"
  ON reviews FOR SELECT
  USING (
    auth.uid() = reviewer_id
    OR auth.uid() = reviewee_id
    OR moderation_status = 'approved'
    OR is_trust_moderator(auth.uid())
  );

CREATE POLICY "Participants can submit reviews after completed trip"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND can_submit_review(trip_id, reviewer_id, reviewee_id)
    AND reviewer_id != reviewee_id
    AND rating >= 1 AND rating <= 5
    AND trip_id IS NOT NULL
  );

CREATE POLICY "Trust moderators can moderate reviews"
  ON reviews FOR UPDATE
  USING (is_trust_moderator(auth.uid()))
  WITH CHECK (is_trust_moderator(auth.uid()));

DROP POLICY IF EXISTS "Participants can update trips" ON trips;
CREATE POLICY "Participants can complete trips"
  ON trips FOR UPDATE
  USING (auth.uid() = traveler_id OR auth.uid() = host_id)
  WITH CHECK (
    auth.uid() = traveler_id OR auth.uid() = host_id
  );

-- Allow messaging on completed stays too
DROP POLICY IF EXISTS "Approved stay participants can view conversations" ON conversations;
CREATE POLICY "Approved stay participants can view conversations"
  ON conversations FOR SELECT
  USING (
    (auth.uid() = traveler_id OR auth.uid() = host_id)
    AND EXISTS (
      SELECT 1 FROM stay_requests sr
      WHERE sr.id = conversations.stay_request_id
      AND sr.status IN ('approved', 'completed')
    )
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
      AND sr.status IN ('approved', 'completed')
      AND (c.traveler_id = auth.uid() OR c.host_id = auth.uid())
    )
  );
