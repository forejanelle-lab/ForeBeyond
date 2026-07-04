import { NextResponse } from "next/server";
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { getExchangeRates } from "@/lib/exchange-rates";

const CACHE_SECONDS = 60 * 60 * 6;

export async function GET() {
  const { rates, fromFallback } = await getExchangeRates();

  return NextResponse.json(
    {
      base: BASE_CURRENCY,
      rates,
      currencies: SUPPORTED_CURRENCIES,
      ...(fromFallback ? { fallback: true } : {}),
    },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    }
  );
}
