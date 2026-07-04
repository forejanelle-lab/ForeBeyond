import type { SupabaseClient } from "@supabase/supabase-js";
import type { HostListing, Profile, PublicListing } from "@/types/database";

export async function loadPublicListingById(
  supabase: SupabaseClient,
  id: string
): Promise<PublicListing | null> {
  const { data } = await supabase
    .from("public_listings")
    .select("*, trust_score_breakdown")
    .eq("id", id)
    .maybeSingle();

  return (data as PublicListing | null) ?? null;
}

/** Fallback when public_listings view misses a published row (e.g. stale cache). */
export async function loadPublishedListingFallback(
  supabase: SupabaseClient,
  id: string
): Promise<PublicListing | null> {
  const { data: listing } = await supabase
    .from("host_listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) return null;

  const hostListing = listing as HostListing;
  const [{ data: profile }, { data: hostProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("trust_score, trust_score_breakdown, profile_completion, verification_status, full_name")
      .eq("id", hostListing.host_id)
      .maybeSingle(),
    supabase
      .from("host_profiles")
      .select("host_motivation")
      .eq("user_id", hostListing.host_id)
      .maybeSingle(),
  ]);

  const typedProfile = profile as Pick<
    Profile,
    "trust_score" | "trust_score_breakdown" | "profile_completion" | "verification_status" | "full_name"
  > | null;

  return {
    id: hostListing.id,
    host_id: hostListing.host_id,
    title: hostListing.title,
    family_story: hostListing.family_story,
    stay_details: hostListing.stay_details,
    intro_video_url: hostListing.intro_video_url,
    languages: hostListing.languages,
    country: hostListing.country,
    city: hostListing.city,
    meals: hostListing.meals,
    amenities: hostListing.amenities,
    family_activities: hostListing.family_activities,
    house_rules: hostListing.house_rules,
    budget_per_night: hostListing.budget_per_night,
    budget_per_night_3_guests: hostListing.budget_per_night_3_guests,
    budget_per_night_4_guests: hostListing.budget_per_night_4_guests,
    budget_per_night_5_guests: hostListing.budget_per_night_5_guests,
    budget_per_night_6_plus_guests: hostListing.budget_per_night_6_plus_guests,
    pricing_currency: hostListing.pricing_currency ?? "USD",
    max_capacity: hostListing.max_capacity,
    published_at: hostListing.published_at,
    created_at: hostListing.created_at,
    trust_score: typedProfile?.trust_score ?? 0,
    trust_score_breakdown: typedProfile?.trust_score_breakdown ?? null,
    profile_completion: typedProfile?.profile_completion ?? 0,
    verification_status: typedProfile?.verification_status ?? "unverified",
    host_first_name: typedProfile?.full_name?.trim().split(/\s+/)[0] ?? null,
    host_motivation:
      (hostProfile as { host_motivation: string | null } | null)?.host_motivation ?? null,
  };
}

export async function resolveListingForProfilePage(
  supabase: SupabaseClient,
  id: string
): Promise<PublicListing | null> {
  const fromView = await loadPublicListingById(supabase, id);
  if (fromView) return fromView;
  return loadPublishedListingFallback(supabase, id);
}
