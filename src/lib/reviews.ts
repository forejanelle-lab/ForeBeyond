import type { PublicReview, Review, ReviewModerationStatus } from "@/types/database";

export const REVIEW_MODERATION_LABELS: Record<
  ReviewModerationStatus,
  { label: string; variant: "outline" | "success" | "warning" | "default" }
> = {
  pending: { label: "Pending Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "default" },
  hidden: { label: "Hidden", variant: "outline" },
};

export const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
};

export function formatAverageRating(reviews: Pick<Review | PublicReview, "rating">[]) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return avg.toFixed(1);
}

export function countPositiveReviews(reviews: Pick<Review | PublicReview, "is_positive">[]) {
  return reviews.filter((r) => r.is_positive).length;
}

export function isTripPastEndDate(endDate: string | null) {
  if (!endDate) return false;
  const end = new Date(endDate + "T23:59:59");
  return end.getTime() <= Date.now();
}

export function canShowReviewForm(params: {
  tripStatus: string;
  userId: string;
  travelerId: string;
  hostId: string;
  existingReview?: Review | null;
}) {
  if (params.tripStatus !== "completed") return false;
  if (params.existingReview) return false;
  return params.userId === params.travelerId || params.userId === params.hostId;
}

export function getRevieweeId(params: {
  userId: string;
  travelerId: string;
  hostId: string;
}) {
  if (params.userId === params.travelerId) return params.hostId;
  if (params.userId === params.hostId) return params.travelerId;
  return null;
}

export function getReviewerRole(params: {
  userId: string;
  travelerId: string;
}): "traveler" | "host" {
  return params.userId === params.travelerId ? "traveler" : "host";
}
