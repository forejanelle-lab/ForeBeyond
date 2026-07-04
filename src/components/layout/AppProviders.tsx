"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { CurrencyProvider } from "@/components/i18n/CurrencyProvider";
import type { Messages } from "@/lib/i18n/messages";
import type { SupportedLanguageCode } from "@/lib/languages";

interface AppProvidersProps {
  children: ReactNode;
  locale: SupportedLanguageCode;
  messages: Messages;
  initialCurrency?: string | null;
  initialExchangeRates?: Record<string, number> | null;
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
      <CurrencyProvider initialCurrency={initialCurrency} initialExchangeRates={initialExchangeRates}>
        {children}
      </CurrencyProvider>
    </LocaleProvider>
  );
}
