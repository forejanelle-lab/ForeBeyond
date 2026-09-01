"use client";

import { useEffect, useState } from "react";
import { shouldOfferTranslation } from "@/lib/language-detect";
import { DEFAULT_LANGUAGE, parseLanguageCode } from "@/lib/languages";
import { useLocaleOptional } from "@/components/i18n/LocaleProvider";

const translationCache = new Map<string, string>();

function cacheKey(text: string, targetLang: string) {
  return `${targetLang}:${text}`;
}

async function fetchTranslation(text: string, targetLang: string): Promise<string | null> {
  const key = cacheKey(text, targetLang);
  const cached = translationCache.get(key);
  if (cached) return cached;

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });

  const data = (await response.json()) as {
    translatedText?: string;
    error?: string;
  };

  if (!response.ok || !data.translatedText) {
    return null;
  }

  translationCache.set(key, data.translatedText);
  return data.translatedText;
}

function useSiteLocale() {
  const localeContext = useLocaleOptional()?.locale;
  return parseLanguageCode(localeContext ?? DEFAULT_LANGUAGE);
}

export function useAutoTranslation(text: string | null | undefined, enabled = true) {
  const targetLang = useSiteLocale();
  const source = text?.trim() ?? "";
  const shouldTranslate =
    enabled && Boolean(source) && shouldOfferTranslation(source, targetLang);

  const [displayText, setDisplayText] = useState(source);

  useEffect(() => {
    setDisplayText(source);

    if (!shouldTranslate || !source) return;

    let cancelled = false;

    void fetchTranslation(source, targetLang).then((translated) => {
      if (!cancelled && translated) {
        setDisplayText(translated);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [source, shouldTranslate, targetLang]);

  return displayText;
}

interface AutoTranslatableTextProps {
  text: string | null | undefined;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  enabled?: boolean;
}

export function AutoTranslatableText({
  text,
  className = "",
  as: Component = "span",
  enabled = true,
}: AutoTranslatableTextProps) {
  const displayText = useAutoTranslation(text, enabled);

  if (!text?.trim()) return null;

  return <Component className={className}>{displayText}</Component>;
}
