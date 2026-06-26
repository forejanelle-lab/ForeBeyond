import { Star } from "lucide-react";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";

interface TrustScorePanelProps {
  score: number;
  reviewCount?: number;
  avgRating?: string | null;
  showBreakdownLink?: boolean;
  compact?: boolean;
}

export function TrustScorePanel({
  score,
  reviewCount = 0,
  avgRating,
  showBreakdownLink = true,
  compact = false,
}: TrustScorePanelProps) {
  return (
    <Card variant="elevated" padding={compact ? "md" : "lg"} className="text-center">
      <p className="text-sm font-medium text-charcoal-light mb-4">Trust Score</p>
      <TrustScoreRing score={score} size={compact ? "sm" : "md"} />
      {(avgRating || reviewCount > 0) && (
        <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-forest">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="font-medium">{avgRating ?? "—"}</span>
          {reviewCount > 0 && (
            <span className="text-charcoal-light">({reviewCount} reviews)</span>
          )}
        </div>
      )}
      {showBreakdownLink && (
        <ButtonLink href="/trust-center/dashboard" variant="ghost" size="sm" className="mt-4">
          See how it works
        </ButtonLink>
      )}
    </Card>
  );
}
