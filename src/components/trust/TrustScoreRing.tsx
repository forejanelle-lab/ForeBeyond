import { Shield } from "lucide-react";
import { TRUST_SCORE_MAX, formatTrustPoints, getPublicTrustSummary, getTrustLevel } from "@/lib/trust-score";
import { Badge } from "@/components/ui/Badge";

interface TrustScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  /** `details` is for hosts/travelers viewing someone else — not a test grade. */
  variant?: "meter" | "details";
}

const sizes = {
  sm: { ring: 80, stroke: 6, text: "text-lg" },
  md: { ring: 120, stroke: 8, text: "text-2xl" },
  lg: { ring: 160, stroke: 10, text: "text-4xl" },
};

export function TrustScoreRing({
  score,
  size = "md",
  showLabel = true,
  variant = "meter",
}: TrustScoreRingProps) {
  if (variant === "details") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-forest">
          <Shield className="h-6 w-6" strokeWidth={1.75} />
        </div>
        {showLabel && (
          <p className="text-sm font-medium text-charcoal">{getPublicTrustSummary(score)}</p>
        )}
        <p className="text-xs text-muted max-w-[14rem] leading-relaxed">
          {formatTrustPoints(score)} — not a rating of this home
        </p>
      </div>
    );
  }

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / TRUST_SCORE_MAX, 1);
  const offset = circumference - progress * circumference;
  const level = getTrustLevel(score);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} className="-rotate-90">
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-sage-dark"
          />
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-forest transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-forest ${text}`}>{score}</span>
          <span className="text-xs text-charcoal-light">/ {TRUST_SCORE_MAX}</span>
        </div>
      </div>
      {showLabel && <Badge variant={level.color}>{level.label}</Badge>}
    </div>
  );
}
