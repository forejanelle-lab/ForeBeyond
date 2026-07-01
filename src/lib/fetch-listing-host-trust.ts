import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTrustScoreBreakdown, type TrustScoreBreakdown } from "@/lib/trust-score";
import {
  normalizeHostReviewSummary,
  normalizeTrustMetricDetails,
  type HostReviewSummary,
  type TrustMetricDetails,
} from "@/lib/host-trust-metric-details";

export interface ListingHostTrustScore {
  trustScore: number;
  breakdown: TrustScoreBreakdown;
  metricDetails: TrustMetricDetails;
  hostReviewSummary: HostReviewSummary | null;
}

function parseListingHostTrustPayload(raw: unknown): ListingHostTrustScore | null {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as {
    trust_score?: number;
    trust_score_breakdown?: unknown;
    metric_details?: unknown;
    host_review_summary?: unknown;
  };

  return {
    trustScore: payload.trust_score ?? 0,
    breakdown: normalizeTrustScoreBreakdown(payload.trust_score_breakdown),
    metricDetails: normalizeTrustMetricDetails(payload.metric_details),
    hostReviewSummary: normalizeHostReviewSummary(payload.host_review_summary),
  };
}

export async function fetchListingHostTrustScore(
  supabase: SupabaseClient,
  listingId: string,
  fallback?: ListingHostTrustScore | null
): Promise<ListingHostTrustScore> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_listing_host_trust_breakdown",
    { p_listing_id: listingId }
  );

  const parsedRpc = !rpcError ? parseListingHostTrustPayload(rpcData) : null;
  if (parsedRpc) return parsedRpc;

  const { data: listingData, error: listingError } = await supabase
    .from("public_listings")
    .select("trust_score, trust_score_breakdown")
    .eq("id", listingId)
    .maybeSingle();

  if (!listingError && listingData) {
    return {
      trustScore: listingData.trust_score ?? fallback?.trustScore ?? 0,
      breakdown: normalizeTrustScoreBreakdown(listingData.trust_score_breakdown),
      metricDetails: fallback?.metricDetails ?? {},
      hostReviewSummary: fallback?.hostReviewSummary ?? null,
    };
  }

  return {
    trustScore: fallback?.trustScore ?? 0,
    breakdown: normalizeTrustScoreBreakdown(fallback?.breakdown),
    metricDetails: fallback?.metricDetails ?? {},
    hostReviewSummary: fallback?.hostReviewSummary ?? null,
  };
}
