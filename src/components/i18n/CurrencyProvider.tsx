"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FALLBACK_EXCHANGE_RATES,
  formatStoredAmount,
  formatAmountWithConversion,
  normalizeCurrencyCode,
  type SupportedCurrencyCode,
} from "@/lib/currency";
import { DEFAULT_LANGUAGE, normalizeLanguageCode } from "@/lib/languages";

interface CurrencyContextValue {
  displayCurrency: SupportedCurrencyCode;
  preferredLanguage: string;
  rates: Record<string, number>;
  ratesLoading: boolean;
  formatAmount: (
    amount: number | null | undefined,
    sourceCurrency?: SupportedCurrencyCode,
    options?: { suffix?: string }
  ) => string;
  formatAmountWithNote: (
    amount: number | null | undefined,
    sourceCurrency?: SupportedCurrencyCode,
    options?: { suffix?: string }
  ) => { primary: string; secondary: string | null };
  formatUsd: (amountUsd: number | null | undefined, options?: { suffix?: string }) => string;
  formatUsdWithNote: (
    amountUsd: number | null | undefined,
    options?: { suffix?: string }
  ) => { primary: string; secondary: string | null };
  setDisplayCurrency: (code: SupportedCurrencyCode) => void;
  setPreferredLanguage: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "forebeyond_display_currency";

function readBrowserLanguage(): string {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  return navigator.language || DEFAULT_LANGUAGE;
}

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: string | null;
  initialLanguage?: string | null;
  initialExchangeRates?: Record<string, number> | null;
}

export function CurrencyProvider({
  children,
  initialCurrency,
  initialLanguage,
  initialExchangeRates,
}: CurrencyProviderProps) {
  const [displayCurrency, setDisplayCurrencyState] = useState<SupportedCurrencyCode>(() =>
    normalizeCurrencyCode(initialCurrency)
  );
  const [preferredLanguage, setPreferredLanguageState] = useState(() =>
    normalizeLanguageCode(initialLanguage ?? readBrowserLanguage())
  );
  const [rates, setRates] = useState<Record<string, number>>(
    () => initialExchangeRates ?? FALLBACK_EXCHANGE_RATES
  );
  const [ratesLoading, setRatesLoading] = useState(() => !initialExchangeRates);

  useEffect(() => {
    if (initialCurrency) {
      setDisplayCurrencyState(normalizeCurrencyCode(initialCurrency));
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDisplayCurrencyState(normalizeCurrencyCode(stored));
    } catch {
      /* ignore */
    }
  }, [initialCurrency]);

  useEffect(() => {
    if (initialLanguage) {
      setPreferredLanguageState(normalizeLanguageCode(initialLanguage));
    }
  }, [initialLanguage]);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const response = await fetch("/api/exchange-rates");
        if (!response.ok) return;
        const data = (await response.json()) as { rates?: Record<string, number> };
        if (!cancelled && data.rates) setRates(data.rates);
      } catch (error) {
        console.error("Failed to load exchange rates:", error);
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    }

    loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const setDisplayCurrency = useCallback((code: SupportedCurrencyCode) => {
    setDisplayCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const setPreferredLanguage = useCallback((code: string) => {
    setPreferredLanguageState(normalizeLanguageCode(code));
  }, []);

  const formatAmount = useCallback(
    (
      amount: number | null | undefined,
      sourceCurrency: SupportedCurrencyCode = "USD",
      options?: { suffix?: string }
    ) => formatStoredAmount(amount, sourceCurrency, displayCurrency, rates, options),
    [displayCurrency, rates]
  );

  const formatAmountWithNote = useCallback(
    (
      amount: number | null | undefined,
      sourceCurrency: SupportedCurrencyCode = "USD",
      options?: { suffix?: string }
    ) => formatAmountWithConversion(amount, sourceCurrency, displayCurrency, rates, options),
    [displayCurrency, rates]
  );

  /** @deprecated Use formatAmount — pass listing source currency when not USD */
  const formatUsd = useCallback(
    (amountUsd: number | null | undefined, options?: { suffix?: string }) =>
      formatAmount(amountUsd, "USD", options),
    [formatAmount]
  );

  const formatUsdWithNote = useCallback(
    (amountUsd: number | null | undefined, options?: { suffix?: string }) =>
      formatAmountWithNote(amountUsd, "USD", options),
    [formatAmountWithNote]
  );

  const value = useMemo(
    () => ({
      displayCurrency,
      preferredLanguage,
      rates,
      ratesLoading,
      formatAmount,
      formatAmountWithNote,
      formatUsd,
      formatUsdWithNote,
      setDisplayCurrency,
      setPreferredLanguage,
    }),
    [
      displayCurrency,
      preferredLanguage,
      rates,
      ratesLoading,
      formatAmount,
      formatAmountWithNote,
      formatUsd,
      formatUsdWithNote,
      setDisplayCurrency,
      setPreferredLanguage,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

export function useCurrencyOptional() {
  return useContext(CurrencyContext);
}
