"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, X, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/reviews/StarRating";
import { REVIEW_MODERATION_LABELS } from "@/lib/reviews";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Review, ReviewModerationStatus } from "@/types/database";

interface ReviewModerationPanelProps {
  reviews: Review[];
}

export function ReviewModerationPanel({ reviews: initialReviews }: ReviewModerationPanelProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function moderate(reviewId: string, status: ReviewModerationStatus, notes?: string) {
    setLoadingId(reviewId);
    setError("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderation_notes: notes ?? null,
      })
      .eq("id", reviewId);

    if (updateError) {
      setError(updateError.message);
      setLoadingId(null);
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, moderation_status: status, moderation_notes: notes ?? null }
          : r
      )
    );
    setLoadingId(null);
    router.refresh();
  }

  const pending = reviews.filter(
    (r) => r.moderation_status === "pending" && r.rating <= 3
  );

  return (
    <div className="space-y-6">
      <Card variant="outline" padding="md">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-forest" />
          <h2 className="font-semibold text-forest">Review Moderation Queue</h2>
        </div>
        <p className="text-sm text-charcoal-light">
          Reviews rated 1–3 stars require manual approval before they appear publicly and affect trust scores.
        </p>
        <p className="text-sm font-medium text-forest mt-3">
          {pending.length} pending guest review{pending.length === 1 ? "" : "s"}
        </p>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.length === 0 ? (
        <Card variant="outline" padding="md">
          <p className="text-sm text-charcoal-light">No reviews awaiting moderation.</p>
        </Card>
      ) : (
        pending.map((review) => {
          const label = REVIEW_MODERATION_LABELS[review.moderation_status];
          return (
            <Card key={review.id} variant="outline" padding="md" className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StarRating value={review.rating} readonly size="sm" />
                <Badge variant={label.variant}>{label.label}</Badge>
                <span className="text-xs text-charcoal-light capitalize">
                  {review.reviewer_role ?? "member"}
                </span>
              </div>

              {review.comment && (
                <p className="text-sm text-charcoal-light leading-relaxed">{review.comment}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={loadingId === review.id}
                  onClick={() => moderate(review.id, "approved")}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingId === review.id}
                  onClick={() => moderate(review.id, "rejected", "Does not meet community guidelines")}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loadingId === review.id}
                  onClick={() => moderate(review.id, "hidden", "Hidden from public view")}
                >
                  <EyeOff className="h-4 w-4" />
                  Hide
                </Button>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
