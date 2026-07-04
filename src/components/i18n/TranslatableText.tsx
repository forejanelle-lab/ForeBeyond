"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { shouldOfferTranslation } from "@/lib/language-detect";
import {
  DEFAULT_LANGUAGE,
  getTranslationLanguageLabel,
  parseLanguageCode,
} from "@/lib/languages";
import { useLocaleOptional } from "@/components/i18n/LocaleProvider";
import { useBrowserLanguage } from "@/hooks/use-browser-language";

interface TranslatableTextProps {
  text: string;
  className?: string;
  /** Override target language (defaults to browser language) */
  targetLang?: string;
}

export function TranslatableText({ text, className = "", targetLang }: TranslatableTextProps) {
  const locale = useLocaleOptional();
  const browserLanguage = useBrowserLanguage();
  const t = locale?.t ?? ((key: string) => key);
  const resolvedTarget = parseLanguageCode(targetLang ?? browserLanguage ?? DEFAULT_LANGUAGE);
  const targetLabel = getTranslationLanguageLabel(resolvedTarget);

  const [showTranslation, setShowTranslation] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offerTranslation = shouldOfferTranslation(text, resolvedTarget);

  async function handleTranslate() {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translated) {
      setShowTranslation(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: resolvedTarget }),
      });

      const data = (await response.json()) as {
        translatedText?: string;
        error?: string;
      };

      if (!response.ok || !data.translatedText) {
        throw new Error(data.error ?? t("translate.failed"));
      }

      setTranslated(data.translatedText);
      setShowTranslation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("translate.failed"));
    } finally {
      setLoading(false);
    }
  }

  const displayText = showTranslation && translated ? translated : text;

  return (
    <div className="min-w-0">
      <span className={`block whitespace-pre-wrap break-words ${className}`.trim()}>{displayText}</span>
      {offerTranslation && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={loading}
            className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-forest-dark disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              <Languages className="h-3 w-3" aria-hidden />
            )}
            {showTranslation ? t("translate.showOriginal") : t("translate.translateTo", { language: targetLabel })}
          </button>
          {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
        </div>
      )}
    </div>
  );
}
