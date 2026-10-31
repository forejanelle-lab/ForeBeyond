"use client";

import { useCurrencyOptional } from "@/components/i18n/CurrencyProvider";
import {
  FALLBACK_EXCHANGE_RATES,
  formatHostLocalMoney,
  getCurrencyLabel,
} from "@/lib/currency";

interface HostLocalAmountProps {
  amount: number | null | undefined;
  listing: { pricing_currency?: string | null; country?: string | null };
  className?: string;
  showListedNote?: boolean;
}

export function HostLocalAmount({
  amount,
  listing,
  className = "",
  showListedNote = true,
}: HostLocalAmountProps) {
  const currency = useCurrencyOptional();
  const formatted = formatHostLocalMoney(
    amount,
    listing,
    currency?.rates ?? FALLBACK_EXCHANGE_RATES
  );

  return (
    <span className={className}>
      {formatted.primary}
      {showListedNote && formatted.listed && (
        <span className="block text-xs font-normal text-charcoal-light">
          Listed as {formatted.listed} · {getCurrencyLabel(formatted.localCurrency)}
        </span>
      )}
    </span>
  );
}
