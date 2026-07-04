"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { LocaleProvider, useLocale } from "@/components/i18n/LocaleProvider";
import { CurrencyProvider, useCurrency } from "@/components/i18n/CurrencyProvider";
import type { Messages } from "@/lib/i18n/messages";
import type { SupportedLanguageCode } from "@/lib/languages";

interface AppProvidersProps {
  children: ReactNode;
  locale: SupportedLanguageCode;
  messages: Messages;
  initialCurrency?: string | null;
  initialExchangeRates?: Record<string, number> | null;
}

function LanguageSync() {
  const { locale } = useLocale();
  const { setPreferredLanguage } = useCurrency();

  useEffect(() => {
    setPreferredLanguage(locale);
  }, [locale, setPreferredLanguage]);

  return null;
}

export function AppProviders({
  children,
  locale,
  messages,
  initialCurrency,
  initialExchangeRates,
}: AppProvidersProps) {
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <CurrencyProvider
        initialCurrency={initialCurrency}
        initialLanguage={locale}
        initialExchangeRates={initialExchangeRates}
      >
        <LanguageSync />
        {children}
      </CurrencyProvider>
    </LocaleProvider>
  );
}
