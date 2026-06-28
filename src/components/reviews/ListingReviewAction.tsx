"use client";

import { useState } from "react";
import { PenLine, X } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { LISTING_REVIEW_DISABLED_MESSAGE } from "@/lib/listing-review-eligibility";
import type { HostReviewExisting, HostReviewTarget } from "@/lib/listing-review-eligibility";
import { Button } from "@/components/ui/Button";

interface ListingReviewActionProps {
  canReview: boolean;
  canEdit?: boolean;
  target: HostReviewTarget | null;
  existingReview?: HostReviewExisting | null;
  userId: string;
  hostName: string;
}

export function ListingReviewAction({
  canReview,
  canEdit = false,
  target,
  existingReview = null,
  userId,
  hostName,
}: ListingReviewActionProps) {
  const [open, setOpen] = useState(false);
  const buttonLabel = canEdit ? "Edit review" : "Add review";

  return (
    <>
      <div className="relative group inline-flex">
        <Button
          type="button"
          variant={canReview ? "primary" : "secondary"}
          size="sm"
          disabled={!canReview}
          onClick={() => canReview && setOpen(true)}
          className="gap-2"
        >
          <PenLine className="h-4 w-4" />
          {buttonLabel}
        </Button>
        {!canReview && (
          <div
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-xs text-charcoal-light shadow-lg opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
          >
            {LISTING_REVIEW_DISABLED_MESSAGE}
          </div>
        )}
      </div>

      {open && canReview && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close review dialog"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-review-title"
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="listing-review-title" className="text-lg font-semibold text-forest mb-4 pr-8">
              {canEdit ? "Edit review for" : "Review"} {hostName}
            </h2>
            <ReviewForm
              userId={userId}
              travelerId={target.travelerId}
              revieweeId={target.revieweeId}
              revieweeName={hostName}
              tripId={target.source === "trip" ? target.tripId : null}
              experienceBookingId={
                target.source === "experience" ? target.experienceBookingId : null
              }
              existingReview={existingReview}
              onSubmitted={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
