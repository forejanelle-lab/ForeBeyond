/**
 * Guards against listing-currency amounts being treated as USD (display bug class).
 * Run: npm run test:currency
 */
import assert from "node:assert/strict";
import { test } from "node:test";

const SERVICE_FEE_RATE = 0.12;
const FALLBACK_RATES = { USD: 1, JPY: 150 };

function calculateStayTotal(nightlyRate, nights) {
  return Math.round(nightlyRate * nights * 100) / 100;
}

function calculateServiceFee(subtotal) {
  return Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
}

function convertBetweenCurrencies(amount, from, to, rates) {
  const usd = from === "USD" ? amount : amount / rates[from];
  return to === "USD" ? usd : usd * rates[to];
}

function amountToStripeMinorUnits(amount, currency) {
  return currency === "JPY" ? Math.round(amount) : Math.round(amount * 100);
}

function formatJpy(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "JPY" }).format(amount);
}

test("JPY host listed earnings must not format as USD dollars", () => {
  const listedStay = calculateStayTotal(12000, 4);
  assert.equal(listedStay, 48000);

  const wrongUsdLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(listedStay);
  assert.match(wrongUsdLabel, /^\$48,000\.00$/);

  const correctJpyLabel = formatJpy(listedStay);
  assert.match(correctJpyLabel, /^¥48,000$/);
  assert.notEqual(wrongUsdLabel, correctJpyLabel);
});

test("Stripe service fee for JPY listing is 12% on top of listed stay, converted to traveler currency", () => {
  const listedStay = calculateStayTotal(12000, 4);
  const serviceFeeJpy = calculateServiceFee(listedStay);
  assert.equal(serviceFeeJpy, 5760);
  assert.equal(listedStay, 48000);

  const serviceFeeUsd = convertBetweenCurrencies(serviceFeeJpy, "JPY", "USD", FALLBACK_RATES);
  assert.ok(serviceFeeUsd < 100, `expected ~$38 service fee, got $${serviceFeeUsd}`);

  const stripeMinorUsd = amountToStripeMinorUnits(serviceFeeUsd, "USD");
  assert.ok(stripeMinorUsd < 10000, "Stripe charge must be cents-scale USD, not listed stay in JPY");

  assert.notEqual(
    amountToStripeMinorUnits(listedStay, "USD"),
    stripeMinorUsd,
    "charge must not equal listed stay misread as USD cents"
  );
});

test("mislabeled JPY listed stay as USD would exceed real Stripe charge by orders of magnitude", () => {
  const listedStay = calculateStayTotal(12000, 4);
  const serviceFeeJpy = calculateServiceFee(listedStay);
  const serviceFeeUsd = convertBetweenCurrencies(serviceFeeJpy, "JPY", "USD", FALLBACK_RATES);

  const displayBugUsd = listedStay;
  assert.ok(
    displayBugUsd / serviceFeeUsd > 5,
    "display bug amount should be vastly larger than actual Stripe charge"
  );
});
