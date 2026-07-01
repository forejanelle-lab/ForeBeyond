import { TRUST_SCORE_FACTORS, getTrustScoreFactorDescription, type TrustScoreBreakdown } from "@/lib/trust-score";
import {
  formatTrustMetricDetailLine,
  formatTrustMetricPoints,
  type TrustMetricDetails,
} from "@/lib/host-trust-metric-details";
import type { UserRole } from "@/types/database";

interface TrustScoreBreakdownProps {
  breakdown: TrustScoreBreakdown;
  role?: UserRole | null;
  perspective?: "self" | "host-public";
  metricDetails?: TrustMetricDetails;
}

export function TrustScoreBreakdown({
  breakdown,
  role,
  perspective = "self",
  metricDetails,
}: TrustScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {TRUST_SCORE_FACTORS.map((factor) => {
        const earned = breakdown[factor.key] ?? 0;
        const detail = metricDetails?.[factor.key];
        const percent = factor.maxPoints > 0 ? (earned / factor.maxPoints) * 100 : 0;
        const detailLine =
          perspective === "host-public"
            ? formatTrustMetricDetailLine(factor.key, detail)
            : null;
        const pointsLabel = formatTrustMetricPoints(detail, earned, factor.maxPoints);

        return (
          <div key={factor.key}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-charcoal">{factor.label}</p>
                <p className="text-xs text-charcoal-light leading-snug">
                  {detailLine ??
                    getTrustScoreFactorDescription(factor.key, role, perspective)}
                </p>
              </div>
              <span className="text-sm font-semibold text-forest tabular-nums shrink-0">
                {pointsLabel}
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
