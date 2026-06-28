"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RATING_LABELS, getReviewerRole } from "@/lib/reviews";
import type { HostReviewExisting } from "@/lib/listing-review-eligibility";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface ReviewFormProps {
  userId: string;
  travelerId: string;
  revieweeId: string;
  revieweeName: string;
  tripId?: string | null;
  experienceBookingId?: string | null;
  existingReview?: HostReviewExisting | null;
  onSubmitted?: () => void;
}

export function ReviewForm({
  tripId = null,
  experienceBookingId = null,
  userId,
  travelerId,
  revieweeId,
  revieweeName,
  existingReview = null,
  onSubmitted,
}: ReviewFormProps) {
  const router = useRouter();
  const isEditing = Boolean(existingReview?.id);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const showCard = !onSubmitted;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    if (!isEditing && !tripId && !experienceBookingId) {
      setError("Unable to submit review for this stay.");
      return;
    }

    setIsLoading(true);
    setError("");

    const supabase = createClient();
    const payload = {
      rating,
      comment: comment.trim() || null,
    };

    const { error: saveError } = isEditing
      ? await supabase.from("reviews").update(payload).eq("id", existingReview!.id).eq("reviewer_id", userId)
      : await supabase.from("reviews").insert({
          trip_id: tripId,
          ...(experienceBookingId ? { experience_booking_id: experienceBookingId } : {}),
          reviewer_id: userId,
          reviewee_id: revieweeId,
          ...payload,
          reviewer_role: getReviewerRole({ userId, travelerId }),
        });

    if (saveError) {
      setError(saveError.message);
      setIsLoading(false);
      return;
    }

    setSubmitted(true);
    setIsLoading(false);
    onSubmitted?.();
    router.refresh();
  }

  if (submitted) {
    const success = (
      <p className="text-sm text-forest font-medium">
        {isEditing ? "Your review has been updated." : "Thank you! Your review has been posted."}
      </p>
    );

    if (!showCard) return success;

    return (
      <Card variant="outline" padding="md" className="bg-sage/30">
        {success}
      </Card>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!onSubmitted && (
        <>
          <h3 className="font-semibold text-forest mb-1">
            {isEditing ? "Edit your review" : "Leave a review"}
          </h3>
          <p className="text-sm text-charcoal-light mb-4">
            Share your experience with {revieweeName}.
          </p>
        </>
      )}

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
        {isLoading ? "Saving…" : isEditing ? "Update review" : "Submit review"}
      </Button>
    </form>
  );

  if (!showCard) return form;

  return (
    <Card variant="outline" padding="md">
      {form}
    </Card>
  );
}
