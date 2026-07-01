-- Public RPC for host trust score breakdown on listing pages (no PII).
-- Also refreshes PostgREST schema cache for public_listings.trust_score_breakdown.

CREATE OR REPLACE FUNCTION public.get_listing_host_trust_breakdown(p_listing_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'trust_score', p.trust_score,
    'trust_score_breakdown', COALESCE(p.trust_score_breakdown, '{}'::jsonb)
  )
  FROM host_listings hl
  JOIN profiles p ON p.id = hl.host_id
  WHERE hl.id = p_listing_id
    AND hl.status = 'published'
    AND p.onboarding_complete = TRUE;
$$;

GRANT EXECUTE ON FUNCTION public.get_listing_host_trust_breakdown(UUID) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
