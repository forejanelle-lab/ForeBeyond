-- Hosts reviewing a stay request (any status) can read the traveler's full profile,
-- including avatar_url and trust_score_breakdown.

DROP POLICY IF EXISTS "Hosts with stay request can view traveler profile" ON profiles;
CREATE POLICY "Hosts with stay request can view traveler profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.host_has_stay_request_with_traveler((select auth.uid()), id));

-- Travelers with a stay request can read the host's full profile for the same reason.
DROP POLICY IF EXISTS "Travelers with stay request can view host profile" ON profiles;
CREATE POLICY "Travelers with stay request can view host profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.host_has_stay_request_with_traveler(id, (select auth.uid())));
