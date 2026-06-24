import { StarRating } from "@/components/reviews/StarRating";
import { Badge } from "@/components/ui/Badge";
import { REVIEW_MODERATION_LABELS } from "@/lib/reviews";
import type { PublicReview, Review } from "@/types/database";

interface ReviewCardProps {
  review: Review | PublicReview;
  showModeration?: boolean;
  showReviewerName?: boolean;
}

export function ReviewCard({
  review,
  showModeration = false,
  showReviewerName = false,
}: ReviewCardProps) {
  const reviewerName =
    "reviewer_first_name" in review ? review.reviewer_first_name : null;

  return (
    <article className="border-b border-sage-dark/30 pb-4 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <StarRating value={review.rating} readonly size="sm" />
        {showReviewerName && reviewerName && (
          <span className="text-xs font-medium text-forest">{reviewerName}</span>
        )}
        {review.reviewer_role && (
          <span className="text-xs text-charcoal-light capitalize">{review.reviewer_role}</span>
        )}
        {showModeration && "moderation_status" in review && review.moderation_status !== "approved" && (
          <Badge variant={REVIEW_MODERATION_LABELS[review.moderation_status].variant}>
            {REVIEW_MODERATION_LABELS[review.moderation_status].label}
          </Badge>
        )}
      </div>
      {review.comment && (
        <p className="text-sm text-charcoal-light leading-relaxed">{review.comment}</p>
      )}
      <time className="block text-xs text-charcoal-light/70 mt-2" dateTime={review.created_at}>
        {new Date(review.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </time>
    </article>
  );
}
