import { Shield, Star } from "lucide-react";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { TrustBadge, PublicReview } from "@/types/database";

interface ListingTrustPanelProps {
  hostFirstName: string | null;
  trustScore: number;
  verificationStatus: string;
  badges: TrustBadge[];
  reviews: PublicReview[];
}

export function ListingTrustPanel({
  hostFirstName,
  trustScore,
  verificationStatus,
  badges,
  reviews,
}: ListingTrustPanelProps) {
  const positiveReviews = reviews.filter((r) => r.is_positive);
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <Card variant="outline" padding="lg" className="text-center">
        <p className="text-sm text-charcoal-light mb-4">
          Hosted by {hostFirstName ?? "a verified family"}
        </p>
        <TrustScoreRing score={trustScore} size="md" />
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Badge variant={verificationStatus === "verified" ? "success" : "outline"}>
            <Shield className="h-3 w-3" />
            {verificationStatus === "verified" ? "Verified Host" : "Verification pending"}
          </Badge>
          {avgRating && (
            <Badge variant="gold">
              <Star className="h-3 w-3" />
              {avgRating} ({reviews.length} reviews)
            </Badge>
          )}
        </div>
      </Card>

      {badges.length > 0 && (
        <Card variant="outline" padding="md">
          <h3 className="font-semibold text-forest mb-3">Trust Badges</h3>
          <TrustBadges badges={badges} emptyMessage="" />
        </Card>
      )}

      {reviews.length > 0 && (
        <Card variant="outline" padding="md">
          <h3 className="font-semibold text-forest mb-3">Traveler Reviews</h3>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b border-sage-dark/30 pb-3 last:border-0">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-charcoal-light">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
          {positiveReviews.length > 0 && (
            <p className="text-xs text-charcoal-light mt-3">
              {positiveReviews.length} of {reviews.length} travelers recommend this family
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
