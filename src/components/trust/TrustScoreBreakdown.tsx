import { TRUST_SCORE_FACTORS, type TrustScoreBreakdown } from "@/lib/trust-score";

interface TrustScoreBreakdownProps {
  breakdown: TrustScoreBreakdown;
}

export function TrustScoreBreakdown({ breakdown }: TrustScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {TRUST_SCORE_FACTORS.map((factor) => {
        const earned = breakdown[factor.key] ?? 0;
        const percent = factor.maxPoints > 0 ? (earned / factor.maxPoints) * 100 : 0;

        return (
          <div key={factor.key}>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <p className="text-sm font-medium text-charcoal">{factor.label}</p>
                <p className="text-xs text-charcoal-light">{factor.description}</p>
              </div>
              <span className="text-sm font-semibold text-forest tabular-nums">
                {earned}/{factor.maxPoints}
              </span>
            </div>
            <div className="h-2 rounded-full bg-sage-dark/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-forest transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
