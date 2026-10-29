-- Admin user pages link to /trips/[id]. Participants-only select hid those rows
-- from platform admins, so "View trip" 404'd.

DROP POLICY IF EXISTS "Admins can view all trips" ON trips;
CREATE POLICY "Admins can view all trips"
  ON trips FOR SELECT
  USING (is_admin(auth.uid()));
