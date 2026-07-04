"use client";

import { useCurrencyOptional } from "@/components/i18n/CurrencyProvider";
import {
  currencyForCountry,
  formatStoredAmount,
  normalizeCurrencyCode,
  resolveListingPricingCurrency,
  type SupportedCurrencyCode,
} from "@/lib/currency";

interface MoneyPropsBase {
  /** Stored amount in `sourceCurrency` (prop name kept for backward compatibility) */
  amountUsd: number | null | undefined;
  /** Currency the stored amount is in — required; use ListingMoney when displaying listing amounts */
  sourceCurrency: SupportedCurrencyCode | string;
  hostCountry?: string | null;
  suffix?: string;
  className?: string;
}

export type MoneyProps = MoneyPropsBase;

export interface ListingMoneyProps {
  amount: number | null | undefined;
  listing: { pricing_currency?: string | null; country?: string | null };
  suffix?: string;
  className?: string;
}

function resolveSourceCurrency(
  sourceCurrency?: SupportedCurrencyCode | string | null,
  hostCountry?: string | null
): SupportedCurrencyCode {
  if (sourceCurrency?.trim()) return normalizeCurrencyCode(sourceCurrency);
  if (hostCountry?.trim()) return currencyForCountry(hostCountry);
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "[Money] Missing sourceCurrency/hostCountry — defaulting to USD. Pass listing currency explicitly."
    );
  }
  return "USD";
}

export function ListingMoneyOrDash({ amount, listing, className }: ListingMoneyProps) {
  if (amount == null || amount <= 0) {
    return <span className={className}>—</span>;
  }
  const sourceCurrency = resolveListingPricingCurrency(listing);
  return (
    <Money
      amountUsd={amount}
      sourceCurrency={sourceCurrency}
      hostCountry={listing.country}
      className={className}
    />
  );
}

export function ListingMoney({ amount, listing, suffix, className }: ListingMoneyProps) {
  const sourceCurrency = resolveListingPricingCurrency(listing);
  return (
    <Money
      amountUsd={amount}
      sourceCurrency={sourceCurrency}
      hostCountry={listing.country}
      suffix={suffix}
      className={className}
    />
  );
}

export function MoneyOrDash({
  amountUsd,
  sourceCurrency,
  hostCountry,
  className,
}: Omit<MoneyProps, "suffix">) {
  if (amountUsd == null || amountUsd <= 0) {
    return <span className={className}>—</span>;
  }
  return (
    <Money
      amountUsd={amountUsd}
      sourceCurrency={sourceCurrency}
      hostCountry={hostCountry}
      className={className}
    />
  );
}

export function Money({
  amountUsd,
  sourceCurrency,
  hostCountry,
  suffix,
  className,
}: MoneyProps) {
  const currency = useCurrencyOptional();
  const source = resolveSourceCurrency(sourceCurrency, hostCountry);

  if (!currency) {
    const fallback = formatStoredAmount(amountUsd, source, source, { [source]: 1 }, { suffix });
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={className}>
      {currency.formatAmount(amountUsd, source, { suffix })}
    </span>
  );
}

export function MoneyWithConversionNote({
  amountUsd,
  sourceCurrency,
  hostCountry,
  suffix,
  className,
}: MoneyProps) {
  const currency = useCurrencyOptional();
  const source = resolveSourceCurrency(sourceCurrency, hostCountry);

  if (!currency) {
    return (
      <Money
        amountUsd={amountUsd}
        sourceCurrency={source}
        suffix={suffix}
        className={className}
      />
    );
  }

  const { primary, secondary } = currency.formatAmountWithNote(amountUsd, source, { suffix });

  return (
    <span className={className}>
      {primary}
      {secondary && (
        <span className="block text-xs font-normal text-charcoal-light mt-0.5">{secondary}</span>
      )}
    </span>
  );
}
