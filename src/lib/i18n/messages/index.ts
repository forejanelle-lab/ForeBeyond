import de from "@/lib/i18n/messages/de";
import en from "@/lib/i18n/messages/en";
import es from "@/lib/i18n/messages/es";
import fr from "@/lib/i18n/messages/fr";
import it from "@/lib/i18n/messages/it";
import ja from "@/lib/i18n/messages/ja";
import pt from "@/lib/i18n/messages/pt";
import { DEFAULT_LANGUAGE, type SupportedLanguageCode } from "@/lib/languages";

type DeepStringMap<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringMap<T[K]>;
};

export type Messages = DeepStringMap<typeof en>;

const localeOverlays: Record<SupportedLanguageCode, Partial<Messages>> = {
  en: {},
  es,
  fr,
  de,
  it,
  pt,
  ja,
};

export function getMessages(locale: SupportedLanguageCode): Messages {
  if (locale === DEFAULT_LANGUAGE) return en;
  return { ...en, ...(localeOverlays[locale] ?? {}) } as Messages;
}
