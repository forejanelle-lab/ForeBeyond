export const BASE_CURRENCY = "USD";

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "MXN", label: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "KRW", label: "South Korean Won", symbol: "₩" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

/** Used until live rates load from /api/exchange-rates */
export const FALLBACK_EXCHANGE_RATES: Record<SupportedCurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 150,
  MXN: 17,
  BRL: 5,
  INR: 83,
  KRW: 1350,
};

const COUNTRY_CURRENCY: Record<string, SupportedCurrencyCode> = {
  japan: "JPY",
  italy: "EUR",
  france: "EUR",
  germany: "EUR",
  spain: "EUR",
  portugal: "EUR",
  netherlands: "EUR",
  mexico: "MXN",
  brazil: "BRL",
  "united kingdom": "GBP",
  uk: "GBP",
  canada: "CAD",
  australia: "AUD",
  india: "INR",
  "south korea": "KRW",
  "united states": "USD",
  usa: "USD",
};

export function normalizeCurrencyCode(code: string | null | undefined): SupportedCurrencyCode {
  const upper = code?.trim().toUpperCase();
  if (upper && SUPPORTED_CURRENCIES.some((c) => c.code === upper)) {
    return upper as SupportedCurrencyCode;
  }
  return "USD";
}

export function currencyForCountry(country: string | null | undefined): SupportedCurrencyCode {
  if (!country?.trim()) return BASE_CURRENCY as SupportedCurrencyCode;
  const key = country.trim().toLowerCase();
  return COUNTRY_CURRENCY[key] ?? (BASE_CURRENCY as SupportedCurrencyCode);
}

export const BILLING_COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "United Kingdom" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "MX", label: "Mexico" },
  { code: "BR", label: "Brazil" },
  { code: "IN", label: "India" },
  { code: "KR", label: "South Korea" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Netherlands" },
] as const;

export function defaultBillingCountryForCurrency(currency: SupportedCurrencyCode): string {
  const map: Record<SupportedCurrencyCode, string> = {
    USD: "US",
    CAD: "CA",
    GBP: "GB",
    AUD: "AU",
    JPY: "JP",
    MXN: "MX",
    BRL: "BR",
    INR: "IN",
    KRW: "KR",
    EUR: "DE",
  };
  return map[currency] ?? "US";
}

export function getCurrencyLabel(code: SupportedCurrencyCode): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.label ?? code;
}

export function convertToUsd(
  amount: number,
  fromCurrency: SupportedCurrencyCode,
  rates: Record<string, number>
): number {
  if (fromCurrency === BASE_CURRENCY) return amount;
  const rate = rates[fromCurrency];
  if (!rate) return amount;
  return amount / rate;
}

export function convertBetweenCurrencies(
  amount: number,
  fromCurrency: SupportedCurrencyCode,
  toCurrency: SupportedCurrencyCode,
  rates: Record<string, number>
): number {
  const usd = convertToUsd(amount, fromCurrency, rates);
  return convertFromUsd(usd, toCurrency, rates);
}

export function resolveListingPricingCurrency(
  listing: { pricing_currency?: string | null; country?: string | null }
): SupportedCurrencyCode {
  if (listing.pricing_currency?.trim()) {
    return normalizeCurrencyCode(listing.pricing_currency);
  }
  return currencyForCountry(listing.country);
}

export function convertFromUsd(
  amountUsd: number,
  targetCurrency: SupportedCurrencyCode,
  rates: Record<string, number>
): number {
  if (targetCurrency === BASE_CURRENCY) return amountUsd;
  const rate = rates[targetCurrency];
  if (!rate) return amountUsd;
  return amountUsd * rate;
}

export function roundMoneyForCurrency(
  amount: number,
  currency: SupportedCurrencyCode
): number {
  if (currency === "JPY" || currency === "KRW") {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

export function amountToStripeMinorUnits(
  amount: number,
  currency: SupportedCurrencyCode
): number {
  if (currency === "JPY" || currency === "KRW") {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function formatMoneyAmount(
  amount: number,
  currency: SupportedCurrencyCode,
  options?: { locale?: string; suffix?: string }
): string {
  const locale = options?.locale ?? "en-US";
  const fractionDigits = currency === "JPY" || currency === "KRW" ? 0 : 2;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  return options?.suffix ? `${formatted}${options.suffix}` : formatted;
}

export function formatStoredAmount(
  amount: number | null | undefined,
  sourceCurrency: SupportedCurrencyCode,
  displayCurrency: SupportedCurrencyCode,
  rates: Record<string, number>,
  options?: { locale?: string; suffix?: string }
): string {
  if (amount == null) return "Price on request";
  const converted = convertBetweenCurrencies(amount, sourceCurrency, displayCurrency, rates);
  return formatMoneyAmount(converted, displayCurrency, options);
}

/** @deprecated Use formatStoredAmount — amounts are in source currency, not always USD */
export function formatStoredUsdAmount(
  amountUsd: number | null | undefined,
  displayCurrency: SupportedCurrencyCode,
  rates: Record<string, number>,
  options?: { locale?: string; suffix?: string }
): string {
  if (amountUsd == null) return "Price on request";
  return formatStoredAmount(amountUsd, BASE_CURRENCY, displayCurrency, rates, options);
}

export function formatAmountWithConversion(
  amount: number | null | undefined,
  sourceCurrency: SupportedCurrencyCode,
  displayCurrency: SupportedCurrencyCode,
  rates: Record<string, number>,
  options?: { suffix?: string }
): { primary: string; secondary: string | null } {
  if (amount == null) {
    return { primary: "Price on request", secondary: null };
  }

  const primary = formatStoredAmount(amount, sourceCurrency, displayCurrency, rates, options);

  if (displayCurrency === sourceCurrency) {
    return { primary, secondary: null };
  }

  const hostLabel = formatMoneyAmount(amount, sourceCurrency, options);
  return {
    primary,
    secondary: hostLabel,
  };
}

/** @deprecated Use formatAmountWithConversion */
export function formatUsdWithConversion(
  amountUsd: number | null | undefined,
  displayCurrency: SupportedCurrencyCode,
  rates: Record<string, number>,
  options?: { suffix?: string }
): { primary: string; secondary: string | null } {
  if (amountUsd == null) {
    return { primary: "Price on request", secondary: null };
  }

  return formatAmountWithConversion(amountUsd, BASE_CURRENCY, displayCurrency, rates, options);
}
