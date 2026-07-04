import type { Messages } from "@/lib/i18n/messages";
import { getMessages } from "@/lib/i18n/messages";
import { DEFAULT_LANGUAGE, type SupportedLanguageCode } from "@/lib/languages";

export type TranslateVars = Record<string, string | number>;

export type Translator = (key: string, vars?: TranslateVars) => string;

function lookup(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    text
  );
}

export function createTranslator(
  locale: SupportedLanguageCode,
  messages: Messages
): Translator {
  const fallback = getMessages(DEFAULT_LANGUAGE);

  return (key: string, vars?: TranslateVars) => {
    const text = lookup(messages, key) ?? lookup(fallback, key) ?? key;
    return interpolate(text, vars);
  };
}
