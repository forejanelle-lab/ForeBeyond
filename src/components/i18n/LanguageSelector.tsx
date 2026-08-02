"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { buildLocaleCookieValue } from "@/lib/i18n/locale-cookie";
import {
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
} from "@/lib/languages";

interface LanguageSelectorProps {
  userId?: string;
  className?: string;
}

export function LanguageSelector({ userId, className = "" }: LanguageSelectorProps) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(nextRaw: string) {
    const next = normalizeLanguageCode(nextRaw);
    if (next === locale || isSaving) return;

    setIsSaving(true);
    document.cookie = buildLocaleCookieValue(next);

    if (userId) {
      const supabase = createClient();
      await supabase.from("profiles").update({ preferred_language: next }).eq("id", userId);
    }

    router.refresh();
    setIsSaving(false);
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      <Globe className="pointer-events-none absolute left-2.5 h-4 w-4 text-forest/70" aria-hidden="true" />
      <select
        value={locale}
        onChange={(event) => void handleChange(event.target.value)}
        disabled={isSaving}
        aria-label={t("language.label")}
        title={t("language.menuHint")}
        className="h-9 appearance-none rounded-full border border-sage-dark/50 bg-white pl-8 pr-8 text-sm font-medium text-forest hover:border-forest/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-60"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {language.nativeLabel}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute right-2.5 text-[10px] text-charcoal-light"
        aria-hidden="true"
      >
        ▾
      </span>
    </div>
  );
}
