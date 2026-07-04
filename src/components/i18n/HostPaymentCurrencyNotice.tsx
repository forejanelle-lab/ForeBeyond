"use client";

import {
  currencyForCountry,
  type SupportedCurrencyCode,
} from "@/lib/currency";
import { useCurrencyOptional } from "@/components/i18n/CurrencyProvider";
import { Info } from "lucide-react";

interface HostPaymentCurrencyNoticeProps {
  hostCountry?: string | null;
  className?: string;
}

export function HostPaymentCurrencyNotice({
  hostCountry,
  className = "",
}: HostPaymentCurrencyNoticeProps) {
  const currency = useCurrencyOptional();
  const hostCurrency = currencyForCountry(hostCountry);
  const displayCurrency = currency?.displayCurrency ?? ("USD" as SupportedCurrencyCode);

  if (!hostCountry?.trim()) return null;

  const showConversionNote = displayCurrency !== hostCurrency;

  return (
    <div
      className={`flex gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-charcoal-light ${className}`}
      role="note"
    >
      <Info className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p>
        {showConversionNote ? (
          <>
            Prices are shown in your preferred currency ({displayCurrency}) for convenience.
            Payment to your host family is in{" "}
            <strong className="font-medium text-charcoal">{hostCurrency}</strong>
            {hostCountry ? ` (${hostCountry})` : ""}.
          </>
        ) : (
          <>
            Stay payment is coordinated directly with your host in{" "}
            <strong className="font-medium text-charcoal">{hostCurrency}</strong>
            {hostCountry ? ` (${hostCountry})` : ""}.
          </>
        )}
      </p>
    </div>
  );
}
