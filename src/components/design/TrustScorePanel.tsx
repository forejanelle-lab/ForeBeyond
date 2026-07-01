"use client";

import { useState } from "react";
import { ChevronRight, Star } from "lucide-react";
import { HostTrustScoreBreakdownModal } from "@/components/trust/HostTrustScoreBreakdownModal";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { TrustScoreBreakdown } from "@/lib/trust-score";

interface TrustScorePanelProps {
  score: number;
  reviewCount?: number;
  avgRating?: string | null;
  listingReviewCount?: number;
  showBreakdownLink?: boolean;
  compact?: boolean;
  listingId?: string;
  hostName?: string | null;
  breakdown?: TrustScoreBreakdown | null;
}

export function TrustScorePanel({
  score,
  reviewCount = 0,
  avgRating,
  listingReviewCount = 0,
  showBreakdownLink = true,
  compact = false,
  listingId,
  hostName = null,
  breakdown = null,
}: TrustScorePanelProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const canShowHostBreakdown = Boolean(listingId);
  const panelClassName = canShowHostBreakdown
    ? "text-center cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
    : "text-center";

  const content = (
    <>
      <p className="text-sm font-medium text-charcoal-light mb-4">Host Trust Score</p>
      <TrustScoreRing score={score} size={compact ? "sm" : "md"} />
      {(avgRating || reviewCount > 0) && (
        <div className="mt-4 flex flex-col items-center gap-1 text-sm text-forest">
          <div className="flex items-center justify-center gap-1.5">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium">{avgRating ?? "—"}</span>
            {reviewCount > 0 && (
              <span className="text-charcoal-light">
                ({reviewCount} traveler {reviewCount === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
          {listingReviewCount > 0 && listingReviewCount !== reviewCount && (
            <span className="text-xs text-charcoal-light">
              {listingReviewCount} on this listing
            </span>
          )}
        </div>
      )}
      {canShowHostBreakdown ? (
        <p className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-forest">
          View host score breakdown
          <ChevronRight className="h-4 w-4" />
        </p>
      ) : (
        showBreakdownLink && (
          <ButtonLink href="/trust-center/dashboard" variant="ghost" size="sm" className="mt-4">
            See how it works
          </ButtonLink>
        )
      )}
    </>
  );

  return (
    <>
      {canShowHostBreakdown ? (
        <button
          type="button"
          onClick={() => setBreakdownOpen(true)}
          className="w-full text-left"
          aria-label="View host trust score breakdown"
        >
          <Card variant="elevated" padding={compact ? "md" : "lg"} className={panelClassName}>
            {content}
          </Card>
        </button>
      ) : (
        <Card variant="elevated" padding={compact ? "md" : "lg"} className={panelClassName}>
          {content}
        </Card>
      )}

      {canShowHostBreakdown && listingId && (
        <HostTrustScoreBreakdownModal
          open={breakdownOpen}
          listingId={listingId}
          hostName={hostName}
          initialScore={score}
          initialBreakdown={breakdown}
          onClose={() => setBreakdownOpen(false)}
        />
      )}
    </>
  );
}
