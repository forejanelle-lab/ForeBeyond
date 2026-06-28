import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { canShowReviewForm, getRevieweeId } from "@/lib/reviews";
import type { HostReviewExisting } from "@/lib/listing-review-eligibility";
import type { Review } from "@/types/database";

interface TripReviewSectionProps {
  tripId: string;
  userId: string;
  travelerId: string;
  hostId: string;
  tripStatus: string;
  otherName: string;
  tripReviews: Review[];
  userReview: Review | null;
}

function toExistingReview(review: Review | null): HostReviewExisting | null {
  if (!review) return null;
  return {
    id: review.id,
    trip_id: review.trip_id,
    experience_booking_id: review.experience_booking_id,
    rating: review.rating,
    comment: review.comment,
    moderation_status: review.moderation_status,
  };
}

export function TripReviewSection({
  tripId,
  userId,
  travelerId,
  hostId,
  tripStatus,
  otherName,
  tripReviews,
  userReview,
}: TripReviewSectionProps) {
  const revieweeId = getRevieweeId({ userId, travelerId, hostId });
  const showForm = revieweeId
    ? canShowReviewForm({
        tripStatus,
        userId,
        travelerId,
        hostId,
        existingReview: userReview,
      })
    : false;

  const approvedTripReviews = tripReviews.filter(
    (review) => review.moderation_status === "approved" && review.id !== userReview?.id
  );

  return (
    <div className="space-y-4">
      {showForm && revieweeId && (
        <ReviewForm
          tripId={tripId}
          userId={userId}
          travelerId={travelerId}
          revieweeId={revieweeId}
          revieweeName={otherName}
          existingReview={toExistingReview(userReview)}
        />
      )}

      {userReview && !showForm && (
        <ReviewList
          title="Your review"
          reviews={[userReview]}
          showModeration
          showReviewerName={false}
        />
      )}

      {approvedTripReviews.length > 0 && (
        <ReviewList title="Trip reviews" reviews={approvedTripReviews} showReviewerName />
      )}

      {tripStatus === "completed" && !showForm && !userReview && approvedTripReviews.length === 0 && (
        <ReviewList title="Reviews" reviews={[]} emptyMessage="No reviews for this trip yet." />
      )}
    </div>
  );
}
