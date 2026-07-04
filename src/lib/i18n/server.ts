import { getMessages } from "@/lib/i18n/messages";
import { normalizeLocale } from "@/lib/i18n/locale-cookie";
import { createTranslator, type Translator } from "@/lib/i18n/translator";
import { DEFAULT_LANGUAGE, type SupportedLanguageCode } from "@/lib/languages";

/** Site UI stays English; users translate via the browser (e.g. Chrome). */
export async function getServerLocale(): Promise<SupportedLanguageCode> {
  return DEFAULT_LANGUAGE;
}

export async function getServerTranslations(): Promise<{
  locale: SupportedLanguageCode;
  messages: ReturnType<typeof getMessages>;
  t: Translator;
}> {
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  return {
    locale,
    messages,
    t: createTranslator(locale, messages),
  };
}

export { normalizeLocale };
