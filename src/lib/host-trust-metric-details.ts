import type { TrustScoreFactor } from "@/lib/trust-score";

export interface TrustMetricDetailBase {
  points: number;
  max_points: number;
}

export interface VerifiedTrustMetricDetail extends TrustMetricDetailBase {
  verified: boolean;
}

export interface ProfileCompletionMetricDetail extends TrustMetricDetailBase {
  profile_completion_percent: number;
}

export interface CompletedTripsMetricDetail extends TrustMetricDetailBase {
  completed_trips: number;
  completed_host_trips: number;
}

export interface PositiveReviewsMetricDetail extends TrustMetricDetailBase {
  total_reviews: number;
  positive_reviews: number;
  listing_reviews: number;
  listing_positive_reviews: number;
  average_rating: number | null;
}

export type TrustMetricDetails = Partial<{
  email_verified: VerifiedTrustMetricDetail;
  phone_verified: VerifiedTrustMetricDetail;
  government_id: VerifiedTrustMetricDetail;
  address_verification: VerifiedTrustMetricDetail;
  video_verification: VerifiedTrustMetricDetail;
  profile_completion: ProfileCompletionMetricDetail;
  completed_trips: CompletedTripsMetricDetail;
  positive_reviews: PositiveReviewsMetricDetail;
}>;

export interface HostReviewSummary {
  total_reviews: number;
  positive_reviews: number;
  average_rating: number | null;
  listing_reviews: number;
}

export function normalizeTrustMetricDetails(raw: unknown): TrustMetricDetails {
  if (!raw || typeof raw !== "object") return {};
  return raw as TrustMetricDetails;
}

export function normalizeHostReviewSummary(raw: unknown): HostReviewSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const summary = raw as HostReviewSummary;
  return {
    total_reviews: summary.total_reviews ?? 0,
    positive_reviews: summary.positive_reviews ?? 0,
    average_rating:
      summary.average_rating == null ? null : Number(summary.average_rating),
    listing_reviews: summary.listing_reviews ?? 0,
  };
}

export function formatTrustMetricDetailLine(
  key: TrustScoreFactor,
  detail: TrustMetricDetails[TrustScoreFactor]
): string | null {
  if (!detail) return null;

  switch (key) {
    case "email_verified":
    case "phone_verified":
    case "government_id":
    case "address_verification":
    case "video_verification": {
      const verifiedDetail = detail as VerifiedTrustMetricDetail;
      return verifiedDetail.verified ? "Verified" : "Not verified yet";
    }
    case "profile_completion": {
      const profileDetail = detail as ProfileCompletionMetricDetail;
      return `Profile ${profileDetail.profile_completion_percent}% complete`;
    }
    case "completed_trips": {
      const tripDetail = detail as CompletedTripsMetricDetail;
      const count = tripDetail.completed_host_trips;
      if (count === 0) return "No completed stays yet";
      return `${count} completed ${count === 1 ? "stay" : "stays"} as host`;
    }
    case "positive_reviews": {
      const reviewDetail = detail as PositiveReviewsMetricDetail;
      if (reviewDetail.total_reviews === 0) return "No traveler reviews yet";
      const rating =
        reviewDetail.average_rating != null
          ? ` · ${Number(reviewDetail.average_rating).toFixed(1)} avg`
          : "";
      return `${reviewDetail.positive_reviews} of ${reviewDetail.total_reviews} traveler reviews positive${rating}`;
    }
    default:
      return null;
  }
}

export function formatTrustMetricPoints(detail: TrustMetricDetailBase | undefined, earned: number, maxPoints: number) {
  const points = detail?.points ?? earned;
  const max = detail?.max_points ?? maxPoints;
  return `${points} of ${max} pts`;
}
