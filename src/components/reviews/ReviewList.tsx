import { Star } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Card } from "@/components/ui/Card";
import { formatAverageRating, countPositiveReviews } from "@/lib/reviews";
import type { PublicReview, Review } from "@/types/database";

interface ReviewListProps {
  title?: string;
  reviews: (Review | PublicReview)[];
  limit?: number;
  showReviewerName?: boolean;
  showModeration?: boolean;
  emptyMessage?: string;
}

export function ReviewList({
  title = "Reviews",
  reviews,
  limit,
  showReviewerName = true,
  showModeration = false,
  emptyMessage = "No reviews yet.",
}: ReviewListProps) {
  const displayed = limit ? reviews.slice(0, limit) : reviews;
  const avgRating = formatAverageRating(reviews);
  const positiveCount = countPositiveReviews(reviews);

  if (reviews.length === 0) {
    return (
      <Card variant="outline" padding="md">
        <h3 className="font-semibold text-forest mb-2">{title}</h3>
        <p className="text-sm text-charcoal-light">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-forest">{title}</h3>
        {avgRating && (
          <div className="flex items-center gap-1.5 text-sm text-forest">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium">{avgRating}</span>
            <span className="text-charcoal-light">({reviews.length})</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {displayed.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showReviewerName={showReviewerName}
            showModeration={showModeration}
          />
        ))}
      </div>

      {positiveCount > 0 && reviews.length > 1 && (
        <p className="text-xs text-charcoal-light mt-4">
          {positiveCount} of {reviews.length} reviewers recommend
        </p>
      )}
    </Card>
  );
}
