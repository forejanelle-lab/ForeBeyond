import type { SupabaseClient } from "@supabase/supabase-js";
import { finalizeEndedConfirmedTrips } from "@/lib/finalize-ended-trips";
import { createServiceClient } from "@/lib/supabase/service";

export interface HostListingStats {
  bookingCount: number;
  avgResponseTimeMinutes: number | null;
  totalRequests: number;
  respondedRequests: number;
}

type StayRequestStatsRow = {
  id: string;
  status: string;
  host_response: string | null;
  created_at: string;
  updated_at: string;
};

function statsReader(fallback: SupabaseClient): SupabaseClient {
  try {
    return createServiceClient();
  } catch {
    return fallback;
  }
}

function pushDelay(candidates: number[], createdAt: number, iso: string | null) {
  if (!iso) return;
  const delta = new Date(iso).getTime() - createdAt;
  if (delta >= 0) candidates.push(delta);
}

/**
 * Reply time is the earliest evidence the host answered.
 * `updated_at` only counts while the row is still on the host's decision.
 * Confirming, completing, or cancelling a stay rewrites `updated_at` to that
 * later event (often weeks after the reply) and must not be used.
 */
export function getRequestResponseMs(
  request: StayRequestStatsRow,
  firstHostMessageAt: string | null,
  tripCreatedAt: string | null = null
): number | null {
  const createdAt = new Date(request.created_at).getTime();
  if (Number.isNaN(createdAt)) return null;

  const candidates: number[] = [];
  pushDelay(candidates, createdAt, firstHostMessageAt);
  pushDelay(candidates, createdAt, tripCreatedAt);

  const decisionStillOnRow =
    request.status === "host_approved" ||
    request.status === "rejected" ||
    (request.status === "pending" && Boolean(request.host_response?.trim()));

  if (decisionStillOnRow) {
    pushDelay(candidates, createdAt, request.updated_at);
  }

  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

export async function getHostListingStats(
  supabase: SupabaseClient,
  hostId: string,
  listingId: string
): Promise<HostListingStats> {
  await finalizeEndedConfirmedTrips();

  const [{ count: completedTripCount }, { count: listingReviewCount }] = await Promise.all([
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
  ]);

  // Every approved listing review implies a completed stay; unreviewed stays can add more.
  const bookingCount = Math.max(completedTripCount ?? 0, listingReviewCount ?? 0);

  const reader = statsReader(supabase);
  const { data: listingRequests } = await reader
    .from("stay_requests")
    .select("id, status, host_response, created_at, updated_at")
    .eq("host_id", hostId)
    .eq("listing_id", listingId);

  const typedRequests = (listingRequests as StayRequestStatsRow[] | null) ?? [];
  const totalRequests = typedRequests.length;
  const requestIds = typedRequests.map((request) => request.id);

  const firstHostMessageByRequest = new Map<string, string>();
  const tripCreatedAtByRequest = new Map<string, string>();

  if (requestIds.length > 0) {
    const [{ data: messages }, { data: trips }] = await Promise.all([
      reader
        .from("stay_messages")
        .select("stay_request_id, created_at")
        .in("stay_request_id", requestIds)
        .eq("sender_id", hostId)
        .order("created_at", { ascending: true }),
      reader
        .from("trips")
        .select("stay_request_id, created_at")
        .in("stay_request_id", requestIds)
        .order("created_at", { ascending: true }),
    ]);

    for (const message of messages ?? []) {
      const row = message as { stay_request_id: string; created_at: string };
      if (!firstHostMessageByRequest.has(row.stay_request_id)) {
        firstHostMessageByRequest.set(row.stay_request_id, row.created_at);
      }
    }

    for (const trip of trips ?? []) {
      const row = trip as { stay_request_id: string | null; created_at: string };
      if (row.stay_request_id && !tripCreatedAtByRequest.has(row.stay_request_id)) {
        tripCreatedAtByRequest.set(row.stay_request_id, row.created_at);
      }
    }
  }

  const responseTimesMs = typedRequests
    .map((request) =>
      getRequestResponseMs(
        request,
        firstHostMessageByRequest.get(request.id) ?? null,
        tripCreatedAtByRequest.get(request.id) ?? null
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
