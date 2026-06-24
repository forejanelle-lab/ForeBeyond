"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RATING_LABELS, getReviewerRole } from "@/lib/reviews";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ReviewFormProps {
  tripId: string;
  userId: string;
  travelerId: string;
  revieweeId: string;
  revieweeName: string;
}

export function ReviewForm({
  tripId,
  userId,
  travelerId,
  revieweeId,
  revieweeName,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }

    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("reviews").insert({
      trip_id: tripId,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
      reviewer_role: getReviewerRole({ userId, travelerId }),
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setSubmitted(true);
    setIsLoading(false);
    router.refresh();
  }

  if (submitted) {
    return (
      <Card variant="outline" padding="md" className="bg-sage/30">
        <p className="text-sm text-forest font-medium">
          Thank you! Your review has been submitted
          {rating >= 4 ? " and is now visible." : " and is pending moderation."}
        </p>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <h3 className="font-semibold text-forest mb-1">Leave a review</h3>
      <p className="text-sm text-charcoal-light mb-4">
        Share your experience with {revieweeName}.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium text-forest mb-2">Rating</p>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-xs text-charcoal-light mt-1">{RATING_LABELS[rating]}</p>
          )}
        </div>

        <div>
          <label htmlFor="review-comment" className="text-sm font-medium text-forest block mb-2">
            Written review (optional)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="What made this stay memorable?"
            className="w-full rounded-lg border border-sage-dark/40 bg-cream px-3 py-2 text-sm text-charcoal placeholder:text-charcoal-light/60 focus:outline-none focus:ring-2 focus:ring-forest/30 resize-y min-h-[96px]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="primary" size="sm" disabled={isLoading || rating < 1}>
          {isLoading ? "Submitting…" : "Submit review"}
        </Button>
      </form>
    </Card>
  );
}
