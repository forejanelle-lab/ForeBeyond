import type { SupabaseClient } from "@supabase/supabase-js";

export interface HostListingStats {
  bookingCount: number;
  responseRate: number | null;
  totalRequests: number;
}

const RESPONDED_STATUSES = new Set([
  "host_approved",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

export async function getHostListingStats(
  supabase: SupabaseClient,
  hostId: string,
  listingId: string
): Promise<HostListingStats> {
  const [{ count: bookingCount }, { data: requests }] = await Promise.all([
    supabase
      .from("stay_bookings")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listingId),
    supabase
      .from("stay_requests")
      .select("status, host_response")
      .eq("host_id", hostId)
      .eq("listing_id", listingId),
  ]);

  const typedRequests = requests ?? [];
  const totalRequests = typedRequests.length;

  const respondedCount = typedRequests.filter(
    (r) =>
      RESPONDED_STATUSES.has(r.status as string) ||
      Boolean(r.host_response?.trim())
  ).length;

  const responseRate =
    totalRequests > 0 ? Math.round((respondedCount / totalRequests) * 100) : null;

  return {
    bookingCount: bookingCount ?? 0,
    responseRate,
    totalRequests,
  };
}

export function formatResponseRate(rate: number | null, totalRequests: number) {
  if (totalRequests === 0) return "New host";
  if (rate == null) return "—";
  return `${rate}%`;
}
