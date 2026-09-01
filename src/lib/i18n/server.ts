import { cookies } from "next/headers";
import { getMessages } from "@/lib/i18n/messages";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/locale-cookie";
import { createTranslator, type Translator } from "@/lib/i18n/translator";
import { DEFAULT_LANGUAGE, type SupportedLanguageCode } from "@/lib/languages";

export async function getServerLocale(
  profileLanguage?: string | null
): Promise<SupportedLanguageCode> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (fromCookie) {
    return normalizeLocale(fromCookie);
  }

  if (profileLanguage) {
    return normalizeLocale(profileLanguage);
  }

  return DEFAULT_LANGUAGE;
}

export async function getServerTranslations(profileLanguage?: string | null): Promise<{
  locale: SupportedLanguageCode;
  messages: ReturnType<typeof getMessages>;
  t: Translator;
}> {
  const locale = await getServerLocale(profileLanguage);
  const messages = getMessages(locale);
  return {
    locale,
    messages,
    t: createTranslator(locale, messages),
  };
}

export { normalizeLocale };
