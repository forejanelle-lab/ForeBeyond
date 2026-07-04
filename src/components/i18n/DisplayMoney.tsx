"use client";

import { useCurrencyOptional } from "@/components/i18n/CurrencyProvider";
import {
  calculateEffectiveNightlyTotal,
  formatCurrency,
  type ListingPricing,
} from "@/lib/stay-requests";
import { formatStoredAmount, resolveListingPricingCurrency } from "@/lib/currency";

interface DisplayBudgetProps {
  nightlyRateUsd: number | null | undefined;
  listing?: Partial<ListingPricing & { country?: string | null; pricing_currency?: string | null }>;
}

export function DisplayBudget({ nightlyRateUsd, listing }: DisplayBudgetProps) {
  const currency = useCurrencyOptional();
  const source = listing ? resolveListingPricingCurrency(listing) : ("USD" as const);

  if (nightlyRateUsd == null) return <>Rate on request</>;

  const formatted = currency
    ? currency.formatAmount(nightlyRateUsd, source)
    : formatStoredAmount(nightlyRateUsd, source, source, { [source]: 1 });

  return <>{formatted}/night</>;
}

interface DisplayStayRateProps {
  nightlyRateUsd: number | null | undefined;
  listing?: Partial<ListingPricing & { country?: string | null; pricing_currency?: string | null }>;
}

export function DisplayStayRate({ nightlyRateUsd, listing }: DisplayStayRateProps) {
  const currency = useCurrencyOptional();
  const source = listing ? resolveListingPricingCurrency(listing) : ("USD" as const);

  if (nightlyRateUsd == null) return <>Price on request</>;

  const formatted = currency
    ? currency.formatAmount(nightlyRateUsd, source)
    : formatCurrency(nightlyRateUsd);

  return <>{formatted}/night</>;
}

interface DisplayExperiencePriceProps {
  priceUsd: number | null | undefined;
}

export function DisplayExperiencePrice({ priceUsd }: DisplayExperiencePriceProps) {
  const currency = useCurrencyOptional();

  if (priceUsd == null) return <>Price on request</>;

  const formatted = currency
    ? currency.formatAmount(priceUsd, "USD")
    : formatStoredAmount(priceUsd, "USD", "USD", { USD: 1 });

  return <>{formatted}/person</>;
}

interface DisplayStayRateFromPricingProps {
  pricing: ListingPricing;
  guestCount?: number;
  country?: string | null;
}

export function DisplayStayRateFromPricing({
  pricing,
  guestCount = 1,
  country,
}: DisplayStayRateFromPricingProps) {
  const rate = calculateEffectiveNightlyTotal(pricing, guestCount);
  return (
    <DisplayStayRate
      nightlyRateUsd={rate}
      listing={{ ...pricing, country: country ?? pricing.country }}
    />
  );
}
