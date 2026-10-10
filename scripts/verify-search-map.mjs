/**
 * Guards search map city lookups and the fillable trust badge.
 * Run: node scripts/verify-search-map.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coordsSrc = readFileSync(join(root, "src/lib/listing-map-coords.ts"), "utf8");
const geocodeSrc = readFileSync(join(root, "src/lib/geocode-location.ts"), "utf8");
const searchPageSrc = readFileSync(join(root, "src/app/search/page.tsx"), "utf8");
const badgeSrc = readFileSync(join(root, "src/components/trust/SearchTrustBadge.tsx"), "utf8");
const cardSrc = readFileSync(join(root, "src/components/search/FamilySearchCard.tsx"), "utf8");

test("search page renders a map of resolved listing coordinates", () => {
  assert.match(searchPageSrc, /resolveListingMapPoints/);
  assert.match(searchPageSrc, /SearchResultsView/);
  assert.match(geocodeSrc, /nominatim\.openstreetmap\.org/);
});

test("map starts on a regional cluster with readable pin labels", () => {
  const mapSrc = readFileSync(join(root, "src/components/search/SearchFamilyMap.tsx"), "utf8");
  assert.match(coordsSrc, /getInitialMapFocus/);
  assert.match(mapSrc, /family-map-pin-name/);
  assert.match(mapSrc, /family-map-pin-place/);
  assert.match(mapSrc, /minZoom: 4/);
  assert.doesNotMatch(mapSrc, /maxZoom: 12/);
  assert.match(mapSrc, /World_Imagery/);
  assert.match(mapSrc, /World_Boundaries_and_Places/);
  assert.doesNotMatch(mapSrc, /World_Light_Gray_Base/);
  assert.doesNotMatch(mapSrc, /cartocdn/);
});

test("city lookups cover current marketplace hosts, not just country centroids", () => {
  for (const city of [
    "manassas",
    "valliquerville",
    "monteverdi marittimo",
    "castiadas",
    "toyonaka",
    "tokyo",
    "osaka",
    "kyoto",
  ]) {
    assert.match(coordsSrc, new RegExp(`${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*lat:`));
  }
  assert.match(coordsSrc, /豊中市本町:\s*"toyonaka"/);
  assert.match(coordsSrc, /formatEnglishLocation/);
  assert.match(coordsSrc, /displayCityName/);
});

test("search cards use a fillable trust badge instead of placeholder copy", () => {
  assert.match(cardSrc, /SearchTrustBadge/);
  assert.doesNotMatch(cardSrc, /PublicTrustNote/);
  assert.match(badgeSrc, /clipPath/);
  assert.match(badgeSrc, /checks complete/);
  assert.doesNotMatch(badgeSrc, /Trust details on file/);
});
