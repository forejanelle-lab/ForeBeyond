/**
 * Verifies MyMemory translation langpairs (auto| is no longer supported).
 * Run: npm run test:translate
 */
import assert from "node:assert/strict";
import { test } from "node:test";

async function fetchTranslation(text, sourceLang, targetLang) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceLang}|${targetLang}`);

  const response = await fetch(url.toString(), { headers: { "User-Agent": "ForeBeyond/1.0" } });
  const data = await response.json();
  return {
    status: Number(data.responseStatus),
    translated: data.responseData?.translatedText?.trim() ?? "",
  };
}

test("MyMemory rejects auto| langpair", async () => {
  const { status, translated } = await fetchTranslation("こんにちは", "auto", "en");
  assert.notEqual(status, 200);
  assert.match(translated, /INVALID SOURCE LANGUAGE/i);
});

test("MyMemory accepts explicit ja|en langpair", async () => {
  const { status, translated } = await fetchTranslation("こんにちは", "ja", "en");
  assert.equal(status, 200);
  assert.ok(translated.length > 0);
  assert.doesNotMatch(translated, /INVALID SOURCE LANGUAGE/i);
});

test("MyMemory accepts explicit fr|en langpair", async () => {
  const { status, translated } = await fetchTranslation("Bonjour", "fr", "en");
  assert.equal(status, 200);
  assert.ok(translated.length > 0);
});
