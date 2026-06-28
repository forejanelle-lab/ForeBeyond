import { TRUST_SCORE_FACTORS, getTrustScoreFactorDescription, type TrustScoreBreakdown } from "@/lib/trust-score";
import type { UserRole } from "@/types/database";

interface TrustScoreBreakdownProps {
  breakdown: TrustScoreBreakdown;
  role?: UserRole | null;
}

export function TrustScoreBreakdown({ breakdown, role }: TrustScoreBreakdownProps) {
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
                <p className="text-xs text-charcoal-light">
                  {getTrustScoreFactorDescription(factor.key, role)}
                </p>
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
