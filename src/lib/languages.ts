export const DEFAULT_LANGUAGE = "en";

export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English", nativeLabel: "English", shortLabel: "EN" },
  { value: "es", label: "Spanish", nativeLabel: "Español", shortLabel: "ES" },
  { value: "fr", label: "French", nativeLabel: "Français", shortLabel: "FR" },
  { value: "de", label: "German", nativeLabel: "Deutsch", shortLabel: "DE" },
  { value: "it", label: "Italian", nativeLabel: "Italiano", shortLabel: "IT" },
  { value: "pt", label: "Portuguese", nativeLabel: "Português", shortLabel: "PT" },
  { value: "ja", label: "Japanese", nativeLabel: "日本語", shortLabel: "JA" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["value"];

export function normalizeLanguageCode(code: string | null | undefined): SupportedLanguageCode {
  const base = (code?.trim().toLowerCase().split("-")[0] || DEFAULT_LANGUAGE) as SupportedLanguageCode;
  if (SUPPORTED_LANGUAGES.some((lang) => lang.value === base)) {
    return base;
  }
  return DEFAULT_LANGUAGE;
}

export function getLanguageLabel(code: string): string {
  const base = normalizeLanguageCode(code);
  return SUPPORTED_LANGUAGES.find((lang) => lang.value === base)?.label ?? "English";
}

export function getLanguageNativeLabel(code: string): string {
  const base = normalizeLanguageCode(code);
  return SUPPORTED_LANGUAGES.find((lang) => lang.value === base)?.nativeLabel ?? "English";
}

export function getLanguageShortLabel(code: string): string {
  const base = normalizeLanguageCode(code);
  return SUPPORTED_LANGUAGES.find((lang) => lang.value === base)?.shortLabel ?? "EN";
}

/** Raw browser/API language code — not limited to site-supported locales. */
export function parseLanguageCode(code: string | null | undefined): string {
  const base = code?.trim().toLowerCase().split("-")[0];
  return base && base.length >= 2 ? base : DEFAULT_LANGUAGE;
}

export function getTranslationLanguageLabel(code: string): string {
  const known = SUPPORTED_LANGUAGES.find((lang) => lang.value === parseLanguageCode(code));
  if (known) return known.label;

  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(parseLanguageCode(code)) ?? code;
  } catch {
    return code;
  }
}
