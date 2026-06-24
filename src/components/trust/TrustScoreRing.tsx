import { TRUST_SCORE_MAX, getTrustLevel } from "@/lib/trust-score";
import { Badge } from "@/components/ui/Badge";

interface TrustScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizes = {
  sm: { ring: 80, stroke: 6, text: "text-lg" },
  md: { ring: 120, stroke: 8, text: "text-2xl" },
  lg: { ring: 160, stroke: 10, text: "text-4xl" },
};

export function TrustScoreRing({ score, size = "md", showLabel = true }: TrustScoreRingProps) {
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
      {showLabel && (
        <Badge variant={level.color}>{level.label}</Badge>
      )}
    </div>
  );
}
