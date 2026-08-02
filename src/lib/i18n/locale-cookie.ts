import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  normalizeLanguageCode,
  type SupportedLanguageCode,
} from "@/lib/languages";

export const LOCALE_COOKIE_NAME = "forebeyond_locale";

export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function normalizeLocale(code: string | null | undefined): SupportedLanguageCode {
  return normalizeLanguageCode(code);
}

export function buildLocaleCookieValue(locale: SupportedLanguageCode): string {
  return `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS};SameSite=Lax`;
}

/** Pick the best supported locale from the browser Accept-Language header. */
export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): SupportedLanguageCode {
  if (!acceptLanguage?.trim()) {
    return DEFAULT_LANGUAGE;
  }

  const supported = new Set(SUPPORTED_LANGUAGES.map((lang) => lang.value));

  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [langPart, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return { lang: langPart.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of candidates) {
    const normalized = normalizeLanguageCode(lang);
    if (supported.has(normalized)) {
      return normalized;
    }
  }

  return DEFAULT_LANGUAGE;
}
