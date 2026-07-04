/** Lightweight heuristics for translation UI and source-language detection. */

const ENGLISH_HINT =
  /\b(the|and|you|your|was|were|have|with|this|that|from|thank|please|hello|stay|host|family)\b/i;

const NON_LATIN_SCRIPT =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/;

/** Languages to try when Latin script source cannot be identified */
export const LATIN_SOURCE_FALLBACKS = ["es", "fr", "de", "it", "pt"] as const;

export function normalizeLangCode(code: string): string {
  return code.trim().toLowerCase().split("-")[0];
}

export function looksLikeEnglish(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 12) return true;
  if (NON_LATIN_SCRIPT.test(trimmed)) return false;
  if (!ENGLISH_HINT.test(trimmed)) return false;
  const latinLetters = (trimmed.match(/[a-zA-Z]/g) ?? []).length;
  return latinLetters / trimmed.length > 0.85;
}

export function shouldOfferTranslation(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return !looksLikeEnglish(text);
}

/**
 * Best-effort source language for MyMemory (does not support `auto|` langpairs).
 * Returns null when Latin script language is ambiguous — caller should try fallbacks.
 */
export function detectSourceLanguage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (/[\u3040-\u30ff]/.test(trimmed)) return "ja";
  if (/[\uac00-\ud7af]/.test(trimmed)) return "ko";
  if (/[\u4e00-\u9fff]/.test(trimmed)) return "zh-CN";
  if (/[\u0600-\u06ff]/.test(trimmed)) return "ar";
  if (/[\u0400-\u04ff]/.test(trimmed)) return "ru";

  if (/\b(el|la|los|las|gracias|hola|por favor|está|también)\b/i.test(trimmed)) return "es";
  if (/\b(le|les|merci|bonjour|nous|vous|très|être)\b/i.test(trimmed)) return "fr";
  if (/\b(der|die|das|und|ich|nicht|danke)\b/i.test(trimmed)) return "de";
  if (/\b(il|gli|che|grazie|ciao|perché)\b/i.test(trimmed)) return "it";
  if (/\b(não|obrigado|você|como|também)\b/i.test(trimmed)) return "pt";

  if (looksLikeEnglish(trimmed)) return "en";

  return null;
}

export function isMyMemoryErrorText(text: string): boolean {
  return /INVALID SOURCE LANGUAGE|MYMEMORY WARNING|QUERY LENGTH LIMIT|USAGE LIMIT/i.test(text);
}
