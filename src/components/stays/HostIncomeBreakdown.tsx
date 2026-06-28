import { Minus, TrendingUp } from "lucide-react";
import {
  calculateHostEarnings,
  formatCurrency,
  type ListingPricing,
  SERVICE_FEE_RATE,
} from "@/lib/stay-requests";
import type { StayRequest } from "@/types/database";

interface HostIncomeBreakdownProps {
  request: Pick<StayRequest, "start_date" | "end_date" | "guest_count">;
  pricing: ListingPricing;
  variant?: "full" | "compact";
  className?: string;
}

function LineItem({
  label,
  amount,
  muted,
  negative,
}: {
  label: string;
  amount: string;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 text-sm ${muted ? "text-charcoal-light" : "text-charcoal"}`}>
      <span>{label}</span>
      <span className={negative ? "text-red-600/90 tabular-nums" : "tabular-nums font-medium"}>
        {negative ? `−${amount}` : amount}
      </span>
    </div>
  );
}

export function HostIncomeBreakdown({
  request,
  pricing,
  variant = "full",
  className = "",
}: HostIncomeBreakdownProps) {
  if (!request.start_date || !request.end_date) return null;

  const earnings = calculateHostEarnings(
    pricing,
    request.start_date,
    request.end_date,
    request.guest_count
  );
  if (!earnings) return null;

  const serviceChargePct = Math.round(SERVICE_FEE_RATE * 100);
  const rateLine = `${earnings.rateLabel} × ${earnings.nights} night${earnings.nights !== 1 ? "s" : ""} · ${earnings.guestCount} guest${earnings.guestCount !== 1 ? "s" : ""}`;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex flex-col gap-1 rounded-lg border border-sage-dark/40 bg-gradient-to-br from-sage/50 to-cream/80 px-3 py-2 ${className}`}
      >
        <p className="text-[11px] uppercase tracking-wide text-charcoal-light font-medium">
          Estimated earnings
        </p>
        <p className="text-base font-bold text-forest tabular-nums">
          {formatCurrency(earnings.netEarnings)}
        </p>
        <p className="text-[11px] text-charcoal-light">
          {rateLine} · {serviceChargePct}% service charge applied
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-sage-dark/30 bg-gradient-to-br from-white via-sage/20 to-cream/60 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-sage-dark/25 bg-forest/5 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-forest shrink-0" />
        <p className="text-sm font-semibold text-forest">Estimated host earnings</p>
      </div>

      <div className="space-y-2.5 px-4 py-4">
        <LineItem label={rateLine} amount={formatCurrency(earnings.gross)} muted />
        <LineItem
          label={`Service charge (${serviceChargePct}%)`}
          amount={formatCurrency(earnings.commission)}
          negative
        />

        <div className="flex items-center justify-center py-1">
          <Minus className="h-3 w-3 text-charcoal-light/50" />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl bg-forest px-4 py-3 text-white">
          <span className="text-sm font-medium">You receive</span>
          <span className="text-xl font-bold tabular-nums">{formatCurrency(earnings.netEarnings)}</span>
        </div>

        <p className="text-xs text-charcoal-light leading-relaxed pt-1">
          Service charge is deducted from your stay payout. Coordinate the deposit directly with your
          traveler within one week of travel.
        </p>
      </div>
    </div>
  );
}
