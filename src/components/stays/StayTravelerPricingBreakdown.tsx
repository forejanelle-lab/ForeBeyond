import {
  formatCurrency,
  SERVICE_FEE_RATE,
} from "@/lib/stay-requests";

interface StayTravelerPricingBreakdownProps {
  rateLabel: string;
  nights: number;
  guestCount: number;
  subtotal: number;
  serviceFee: number | null;
  /** Show "Total due at confirmation" row (service fee only) */
  showDueAtConfirmation?: boolean;
  footerNote?: string;
  className?: string;
}

export function StayTravelerPricingBreakdown({
  rateLabel,
  nights,
  guestCount,
  subtotal,
  serviceFee,
  showDueAtConfirmation = true,
  footerNote = "Stay payment is coordinated directly with your host.",
  className = "",
}: StayTravelerPricingBreakdownProps) {
  const guests = Math.max(guestCount, 1);

  return (
    <div className={`rounded-xl bg-sage/40 p-4 text-sm space-y-2 ${className}`}>
      <div className="text-charcoal-light space-y-1">
        <p>{rateLabel}</p>
        <p className="text-xs">
          × {nights} night{nights !== 1 ? "s" : ""} · {guests} guest{guests !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex justify-between font-semibold text-forest border-t border-sage-dark/30 pt-2">
        <span>Total Stay</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between text-charcoal-light">
        <span>Service fee ({SERVICE_FEE_RATE * 100}%)</span>
        <span>{formatCurrency(serviceFee)}</span>
      </div>
      {showDueAtConfirmation && (
        <>
          <div className="flex justify-between font-semibold text-forest border-t border-sage-dark/30 pt-2">
            <span>Total due at confirmation</span>
            <span>{formatCurrency(serviceFee)}</span>
          </div>
          <p className="text-xs text-charcoal-light">{footerNote}</p>
        </>
      )}
    </div>
  );
}
