import {
  BASE_CURRENCY,
  FALLBACK_EXCHANGE_RATES,
  SUPPORTED_CURRENCIES,
} from "@/lib/currency";

const CACHE_SECONDS = 60 * 60 * 6; // 6 hours

let cachedRates: { rates: Record<string, number>; fetchedAt: number } | null = null;

export async function getExchangeRates(): Promise<{
  rates: Record<string, number>;
  fromFallback: boolean;
}> {
  const now = Date.now();
  if (cachedRates && now - cachedRates.fetchedAt < CACHE_SECONDS * 1000) {
    return { rates: cachedRates.rates, fromFallback: false };
  }

  const targets = SUPPORTED_CURRENCIES.map((c) => c.code)
    .filter((code) => code !== BASE_CURRENCY)
    .join(",");

  try {
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=${targets}`,
      { next: { revalidate: CACHE_SECONDS } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = (await response.json()) as { rates: Record<string, number> };
    const rates: Record<string, number> = { [BASE_CURRENCY]: 1, ...data.rates };

    cachedRates = { rates, fetchedAt: now };
    return { rates, fromFallback: false };
  } catch {
    return { rates: FALLBACK_EXCHANGE_RATES, fromFallback: true };
  }
}
