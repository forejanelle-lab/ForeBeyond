"use client";

import { Money, MoneyWithConversionNote } from "@/components/i18n/Money";
import { HostPaymentCurrencyNotice } from "@/components/i18n/HostPaymentCurrencyNotice";
import { calculateHostBalance, calculateServiceFee, SERVICE_FEE_RATE } from "@/lib/stay-requests";
import { resolveListingPricingCurrency } from "@/lib/currency";

interface TripBookingSummaryProps {
  totalAmount: number | null;
  serviceFeePaid?: boolean;
  hostCountry?: string | null;
  pricingCurrency?: string | null;
}

export function TripBookingSummary({
  totalAmount,
  serviceFeePaid = false,
  hostCountry,
  pricingCurrency,
}: TripBookingSummaryProps) {
  if (totalAmount == null) return null;

  const sourceCurrency = resolveListingPricingCurrency({
    pricing_currency: pricingCurrency,
    country: hostCountry,
  });
  const serviceFee = calculateServiceFee(totalAmount);
  const hostBalance = calculateHostBalance(totalAmount);

  return (
    <div className="rounded-xl bg-sage/40 p-4 text-sm space-y-3">
      <HostPaymentCurrencyNotice hostCountry={hostCountry} className="mb-1" />
      <div className="flex justify-between text-charcoal-light">
        <span>Total stay</span>
        <Money amountUsd={totalAmount} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
      </div>
      {serviceFee != null && (
        <div className="flex justify-between text-charcoal-light">
          <span>
            Service fee ({SERVICE_FEE_RATE * 100}%)
            {serviceFeePaid ? " · paid" : ""}
          </span>
          <Money amountUsd={serviceFee} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
        </div>
      )}
      <div className="flex justify-between items-start gap-4 border-t border-sage-dark/30 pt-3">
        <div>
          <p className="font-semibold text-forest">Remaining balance</p>
          <p className="text-xs text-charcoal-light mt-0.5">Pay your host directly</p>
        </div>
        <span className="text-lg font-bold text-forest tabular-nums text-right shrink-0">
          <MoneyWithConversionNote
            amountUsd={hostBalance}
            sourceCurrency={sourceCurrency}
            hostCountry={hostCountry}
            className="font-bold"
          />
        </span>
      </div>
      <p className="text-xs text-charcoal-light">
        The remaining balance is coordinated directly with your host.
      </p>
    </div>
  );
}
