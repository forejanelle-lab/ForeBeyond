import type { SupabaseClient } from "@supabase/supabase-js";

export interface HostListingStats {
  bookingCount: number;
  avgResponseTimeMinutes: number | null;
  totalRequests: number;
  respondedRequests: number;
}

const RESPONDED_STATUSES = new Set([
  "host_approved",
  "approved",
  "rejected",
  "completed",
  "cancelled",
]);

type StayRequestStatsRow = {
  id: string;
  status: string;
  host_response: string | null;
  created_at: string;
  updated_at: string;
};

function hostHasResponded(request: StayRequestStatsRow): boolean {
  return (
    RESPONDED_STATUSES.has(request.status) || Boolean(request.host_response?.trim())
  );
}

function getRequestResponseMs(
  request: StayRequestStatsRow,
  firstHostMessageAt: string | null
): number | null {
  const createdAt = new Date(request.created_at).getTime();
  const candidates: number[] = [];

  if (firstHostMessageAt) {
    candidates.push(new Date(firstHostMessageAt).getTime() - createdAt);
  }

  if (hostHasResponded(request)) {
    candidates.push(new Date(request.updated_at).getTime() - createdAt);
  }

  const valid = candidates.filter((ms) => ms >= 0);
  if (valid.length === 0) return null;
  return Math.min(...valid);
}

export async function getHostListingStats(
  supabase: SupabaseClient,
  hostId: string,
  listingId: string
): Promise<HostListingStats> {
  const [{ count: completedTripCount }, { count: listingReviewCount }, { data: requests }] =
    await Promise.all([
      supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("listing_id", listingId)
        .eq("status", "completed"),
      supabase
        .from("public_reviews")
        .select("id", { count: "exact", head: true })
        .eq("reviewee_id", hostId)
        .eq("listing_id", listingId)
        .eq("reviewer_role", "traveler"),
      supabase
        .from("stay_requests")
        .select("id, status, host_response, created_at, updated_at")
        .eq("host_id", hostId)
        .eq("listing_id", listingId),
    ]);

  // Every approved listing review implies a completed stay; unreviewed stays can add more.
  const bookingCount = Math.max(completedTripCount ?? 0, listingReviewCount ?? 0);

  const typedRequests = (requests as StayRequestStatsRow[] | null) ?? [];
  const totalRequests = typedRequests.length;
  const requestIds = typedRequests.map((request) => request.id);

  const firstHostMessageByRequest = new Map<string, string>();

  if (requestIds.length > 0) {
    const { data: messages } = await supabase
      .from("stay_messages")
      .select("stay_request_id, created_at")
      .in("stay_request_id", requestIds)
      .eq("sender_id", hostId)
      .order("created_at", { ascending: true });

    for (const message of messages ?? []) {
      const row = message as { stay_request_id: string; created_at: string };
      if (!firstHostMessageByRequest.has(row.stay_request_id)) {
        firstHostMessageByRequest.set(row.stay_request_id, row.created_at);
      }
    }
  }

  const responseTimesMs = typedRequests
    .map((request) =>
      getRequestResponseMs(
        request,
        firstHostMessageByRequest.get(request.id) ?? null
      )
    )
    .filter((ms): ms is number => ms != null);

  const respondedRequests = responseTimesMs.length;
  const avgResponseTimeMinutes =
    respondedRequests > 0
      ? Math.round(
          responseTimesMs.reduce((sum, ms) => sum + ms, 0) /
            respondedRequests /
            60_000
        )
      : null;

  return {
    bookingCount,
    avgResponseTimeMinutes,
    totalRequests,
    respondedRequests,
  };
}

export function formatMemberSince(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatAverageResponseTime(
  avgMinutes: number | null,
  totalRequests: number,
  respondedRequests: number
) {
  if (totalRequests === 0) return "New host";
  if (respondedRequests === 0 || avgMinutes == null) return "—";

  if (avgMinutes < 1) return "< 1 min";
  if (avgMinutes < 60) {
    return avgMinutes === 1 ? "1 min" : `${avgMinutes} min`;
  }

  const hours = Math.round(avgMinutes / 60);
  if (avgMinutes < 24 * 60) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  const days = Math.round(avgMinutes / (24 * 60));
  return days === 1 ? "1 day" : `${days} days`;
}
