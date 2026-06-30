-- Hosts reviewing a stay request can read traveler onboarding preferences
-- (preferred destinations remain private — hide in app UI).

CREATE OR REPLACE FUNCTION public.host_has_stay_request_with_traveler(
  p_host_id UUID,
  p_traveler_id UUID
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
    WHERE sr.host_id = p_host_id
      AND sr.traveler_id = p_traveler_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.host_has_stay_request_with_traveler(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Hosts with stay request can view traveler onboarding" ON traveler_profiles;
CREATE POLICY "Hosts with stay request can view traveler onboarding"
  ON traveler_profiles FOR SELECT
  USING (public.host_has_stay_request_with_traveler(auth.uid(), user_id));
