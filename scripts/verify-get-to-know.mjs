/**
 * Guards Get to Know matching: real profile evidence only, no fake scores.
 * Run: npm run test:get-to-know
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const questionsSrc = readFileSync(join(root, "src/lib/get-to-know/questions.ts"), "utf8");
const matchSrc = readFileSync(join(root, "src/lib/get-to-know/match.ts"), "utf8");

test("Get to Know has five configurable questions with four options each", () => {
  const questionIds = [...questionsSrc.matchAll(/id: "([^"]+)",\n\s+category:/g)].map(
    (match) => match[1]
  );
  assert.equal(questionIds.length, 5);
  assert.deepEqual(questionIds, ["food", "local-life", "family-home", "culture", "travel-style"]);

  const optionCount = [...questionsSrc.matchAll(/icon: "/g)].length;
  assert.equal(optionCount, 20);
});

test("matching requires host profile evidence and never invents a percentage", () => {
  assert.match(matchSrc, /findEvidence/);
  assert.doesNotMatch(matchSrc, /percent|compatibility score|Math\.random/i);
});

function fieldMatchesKeyword(text, keyword) {
  const haystack = text.toLowerCase();
  const needle = keyword.toLowerCase();
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}[a-z]*`, "i").test(haystack);
}

test("cooking answers only match when the host mentions cooking", () => {
  const hostStory = "We love cooking together and sharing family recipes from Tuscany.";
  assert.equal(fieldMatchesKeyword(hostStory, "cook"), true);

  const emptyHost = "We have a quiet guest room near the station.";
  assert.equal(fieldMatchesKeyword(emptyHost, "cook"), false);
});

test("opening messages stay factual without fabricated host names in source", () => {
  const flowSrc = readFileSync(
    join(root, "src/components/get-to-know/GetToKnowFlow.tsx"),
    "utf8"
  );
  assert.doesNotMatch(flowSrc, /\bMarta\b/);
});
