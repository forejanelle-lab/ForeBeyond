/**
 * Verifies translation button visibility heuristics (shouldOfferTranslation).
 * Run: npm run test:language-detect
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const ENGLISH_HINT =
  /\b(the|and|you|your|was|were|have|with|this|that|from|thank|please|hello|stay|host|family)\b/i;

const NON_LATIN_SCRIPT =
  /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0600-\u06ff\u0400-\u04ff]/;

function normalizeLangCode(code) {
  return code.trim().toLowerCase().split("-")[0];
}

function looksLikeEnglish(text) {
  const trimmed = text.trim();
  if (trimmed.length < 12) return true;
  if (NON_LATIN_SCRIPT.test(trimmed)) return false;
  if (!ENGLISH_HINT.test(trimmed)) return false;
  const latinLetters = (trimmed.match(/[a-zA-Z]/g) ?? []).length;
  const allLetters = (trimmed.match(/\p{L}/gu) ?? []).length;
  if (allLetters === 0) return false;
  return latinLetters / allLetters > 0.85;
}

function detectSourceLanguage(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/[\u3040-\u30ff]/.test(trimmed)) return "ja";
  if (/[\uac00-\ud7af]/.test(trimmed)) return "ko";
  if (/[\u4e00-\u9fff]/.test(trimmed)) return "zh-CN";
  if (looksLikeEnglish(trimmed)) return "en";
  return null;
}

function shouldOfferTranslation(text, targetLang = "en") {
  if (!text?.trim()) return false;
  const target = normalizeLangCode(targetLang);
  const source = detectSourceLanguage(text);
  if (source) return normalizeLangCode(source) !== target;
  if (target === "en") return !looksLikeEnglish(text);
  if (looksLikeEnglish(text)) return true;
  if (NON_LATIN_SCRIPT.test(text)) return true;
  return true;
}

test("English review text offers translate for Japanese browser", () => {
  const text = "We had a wonderful stay with this host family. Thank you for everything!";
  assert.equal(shouldOfferTranslation(text, "ja"), true);
});

test("English review text hidden for English browser", () => {
  const text = "We had a wonderful stay with this host family. Thank you for everything!";
  assert.equal(shouldOfferTranslation(text, "en"), false);
});

test("Japanese message offers translate for English browser", () => {
  assert.equal(shouldOfferTranslation("こんにちは、よろしくお願いします。", "en"), true);
});

test("Japanese message hidden for Japanese browser", () => {
  assert.equal(shouldOfferTranslation("こんにちは、よろしくお願いします。", "ja"), false);
});

test("English message offers translate for Korean browser", () => {
  const text = "Thanks for hosting us — the kids loved your garden!";
  assert.equal(shouldOfferTranslation(text, "ko"), true);
});

test("Short English thanks offers translate for non-English target", () => {
  assert.equal(shouldOfferTranslation("Thanks!", "ja"), true);
});

test("Empty text never offers translate", () => {
  assert.equal(shouldOfferTranslation("", "ja"), false);
  assert.equal(shouldOfferTranslation("   ", "fr"), false);
});

test("French review offers translate for English browser", () => {
  const text = "Merci beaucoup pour votre accueil chaleureux. Nous avons passé un merveilleux séjour.";
  assert.equal(shouldOfferTranslation(text, "en"), true);
});
