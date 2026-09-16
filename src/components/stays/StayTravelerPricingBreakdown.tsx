"use client";

import { DisplayStayRate } from "@/components/i18n/DisplayMoney";
import {
  SERVICE_FEE_RATE,
} from "@/lib/stay-requests";
import { Money, MoneyWithConversionNote } from "@/components/i18n/Money";
import { HostPaymentCurrencyNotice } from "@/components/i18n/HostPaymentCurrencyNotice";
import { resolveListingPricingCurrency } from "@/lib/currency";
import type { ListingPricing } from "@/lib/stay-requests";

interface StayTravelerPricingBreakdownProps {
  nightlyRateUsd: number | null;
  nights: number;
  guestCount: number;
  subtotal: number;
  serviceFee: number | null;
  hostBalance?: number | null;
  listingPricing?: ListingPricing;
  hostCountry?: string | null;
  /** Show service fee due-upon-approval row */
  showDueAtConfirmation?: boolean;
  showDueAtConfirmation?: boolean;
  footerNote?: string;
  className?: string;
}

export function StayTravelerPricingBreakdown({
  nightlyRateUsd,
  nights,
  guestCount,
  subtotal,
  serviceFee,
  hostBalance,
  listingPricing,
  hostCountry,
  showDueAtConfirmation = true,
  footerNote,
  className = "",
}: StayTravelerPricingBreakdownProps) {
  const guests = Math.max(guestCount, 1);
  const sourceCurrency = listingPricing
    ? resolveListingPricingCurrency(listingPricing)
    : resolveListingPricingCurrency({ country: hostCountry });
  const remainingToHost = hostBalance ?? subtotal;
  const travelerTotal =
    serviceFee != null ? Math.round((subtotal + serviceFee) * 100) / 100 : subtotal;

  return (
    <div className={`rounded-xl bg-sage/40 p-4 text-sm space-y-2 ${className}`}>
      <HostPaymentCurrencyNotice hostCountry={hostCountry} className="mb-3" />
      <div className="text-charcoal-light space-y-1">
        <p>
          <DisplayStayRate nightlyRateUsd={nightlyRateUsd} listing={listingPricing} />
        </p>
        <p className="text-xs">
          × {nights} night{nights !== 1 ? "s" : ""} · {guests} guest{guests !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex justify-between text-charcoal-light border-t border-sage-dark/30 pt-2">
        <span>Listed stay (paid to host)</span>
        <Money amountUsd={subtotal} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
      </div>
      <div className="flex justify-between text-charcoal-light">
        <span>Service fee ({SERVICE_FEE_RATE * 100}%)</span>
        <Money amountUsd={serviceFee} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
      </div>
      <div className="flex justify-between font-semibold text-forest">
        <span>You pay</span>
        <Money amountUsd={travelerTotal} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
      </div>
      {remainingToHost != null && (
        <div className="flex justify-between items-start gap-4 text-charcoal-light">
          <span>Remaining balance (pay host)</span>
          <MoneyWithConversionNote
            amountUsd={remainingToHost}
            sourceCurrency={sourceCurrency}
            hostCountry={hostCountry}
            className="text-right shrink-0 tabular-nums"
          />
        </div>
      )}
      {showDueAtConfirmation && serviceFee != null && (
        <>
          <div className="flex justify-between font-semibold text-forest border-t border-sage-dark/30 pt-2">
            <span>Due upon approval</span>
            <Money amountUsd={serviceFee} sourceCurrency={sourceCurrency} hostCountry={hostCountry} />
          </div>
          <p className="text-xs text-charcoal-light">
            The service fee is separate from the listed stay total. Payments are coordinated between
            the traveler and host. Any deposits made beforehand are not refundable through Fore
            Beyond.
          </p>
        </>
      )}
      {footerNote && !showDueAtConfirmation && (
        <p className="text-xs text-charcoal-light">{footerNote}</p>
      )}
    </div>
  );
}
