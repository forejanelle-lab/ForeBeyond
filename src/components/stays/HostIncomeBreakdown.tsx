"use client";

import { Minus, TrendingUp } from "lucide-react";
import { useCurrency } from "@/components/i18n/CurrencyProvider";
import { DisplayStayRate } from "@/components/i18n/DisplayMoney";
import { resolveListingPricingCurrency } from "@/lib/currency";
import {
  calculateHostEarnings,
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
  muted = false,
  negative = false,
}: {
  label: React.ReactNode;
  amount: string;
  muted?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 text-sm ${muted ? "text-charcoal-light" : "text-charcoal"}`}>
      <span>{label}</span>
      <span className="font-medium tabular-nums">
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
  const { formatAmount } = useCurrency();
  const sourceCurrency = resolveListingPricingCurrency(pricing);

  if (!request.start_date || !request.end_date) return null;

  const earnings = calculateHostEarnings(
    pricing,
    request.start_date,
    request.end_date,
    request.guest_count
  );

  if (!earnings) return null;

  const serviceChargePct = SERVICE_FEE_RATE * 100;
  const rateLine = (
    <>
      <DisplayStayRate nightlyRateUsd={earnings.effectiveNightlyTotal} listing={pricing} />
      {" × "}
      {earnings.nights} night{earnings.nights !== 1 ? "s" : ""} · {earnings.guestCount} guest
      {earnings.guestCount !== 1 ? "s" : ""}
    </>
  );

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex flex-col gap-1 rounded-lg border border-sage-dark/40 bg-gradient-to-br from-sage/50 to-cream/80 px-3 py-2 ${className}`}
      >
        <span className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light">
          Est. net earnings
        </span>
        <span className="text-lg font-bold text-forest tabular-nums">
          {formatAmount(earnings.netEarnings, sourceCurrency)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-sage-dark/30 bg-gradient-to-br from-white via-sage/20 to-cream/60 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-sage-dark/20 bg-sage/30 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-forest" />
        <h3 className="font-semibold text-forest text-sm">Estimated host earnings</h3>
      </div>
      <div className="p-4 space-y-3">
        <LineItem label={rateLine} amount={formatAmount(earnings.gross, sourceCurrency)} muted />
        <LineItem
          label={`Service charge (${serviceChargePct}%)`}
          amount={formatAmount(earnings.commission, sourceCurrency)}
          muted
          negative
        />
        <div className="flex items-center justify-between gap-4 border-t border-sage-dark/20 pt-3">
          <span className="text-sm font-semibold text-forest flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 rotate-90 text-charcoal-light" aria-hidden />
            Net earnings
          </span>
          <span className="text-xl font-bold tabular-nums">{formatAmount(earnings.netEarnings, sourceCurrency)}</span>
        </div>
      </div>
    </div>
  );
}
