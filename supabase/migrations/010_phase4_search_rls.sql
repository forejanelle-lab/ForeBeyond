-- Fore Beyond Phase 4: RLS for saved listings
-- Migration: 010_phase4_search_rls

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave listings"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT ON public_listings TO authenticated;
GRANT SELECT ON public_listings TO anon;
