import type { SupabaseClient } from "@supabase/supabase-js";

export const ONE_LISTING_PER_HOST_MESSAGE =
  "Each account can have one family listing for now. Edit your existing listing instead.";

export function isOneListingPerHostError(message: string) {
  return (
    message.includes("idx_host_listings_one_per_host") ||
    message.includes("duplicate key value") ||
    message.includes("one_per_host")
  );
}

export async function getHostListingId(
  supabase: SupabaseClient,
  hostId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("host_listings")
    .select("id")
    .eq("host_id", hostId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}

export async function hostHasListing(supabase: SupabaseClient, hostId: string) {
  const listingId = await getHostListingId(supabase, hostId);
  return listingId != null;
}

export function hostListingManagePath(listingId: string | null) {
  return listingId ? `/host/listings/${listingId}/edit` : "/host/listings";
}
