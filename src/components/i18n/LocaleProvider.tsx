"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Messages } from "@/lib/i18n/messages";
import { createTranslator, type Translator } from "@/lib/i18n/translator";
import type { SupportedLanguageCode } from "@/lib/languages";

interface LocaleContextValue {
  locale: SupportedLanguageCode;
  messages: Messages;
  t: Translator;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  locale: SupportedLanguageCode;
  messages: Messages;
}

export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  const t = useMemo(() => createTranslator(locale, messages), [locale, messages]);

  const value = useMemo(() => ({ locale, messages, t }), [locale, messages, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useLocaleOptional() {
  return useContext(LocaleContext);
}

export function useTranslations() {
  return useLocale().t;
}
