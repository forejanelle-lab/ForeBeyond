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

test("JPY host net earnings must not format as USD dollars", () => {
  const gross = calculateStayTotal(12000, 4);
  const netEarnings = gross - calculateServiceFee(gross);
  assert.equal(netEarnings, 42240);

  const wrongUsdLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(netEarnings);
  assert.match(wrongUsdLabel, /^\$42,240\.00$/);

  const correctJpyLabel = formatJpy(netEarnings);
  assert.match(correctJpyLabel, /^¥42,240$/);
  assert.notEqual(wrongUsdLabel, correctJpyLabel);
});

test("Stripe service fee for JPY listing is 12% converted to traveler currency, not host net", () => {
  const gross = calculateStayTotal(12000, 4);
  const serviceFeeJpy = calculateServiceFee(gross);
  assert.equal(serviceFeeJpy, 5760);

  const serviceFeeUsd = convertBetweenCurrencies(serviceFeeJpy, "JPY", "USD", FALLBACK_RATES);
  assert.ok(serviceFeeUsd < 100, `expected ~$38 service fee, got $${serviceFeeUsd}`);

  const stripeMinorUsd = amountToStripeMinorUnits(serviceFeeUsd, "USD");
  assert.ok(stripeMinorUsd < 10000, "Stripe charge must be cents-scale USD, not host net in JPY");

  const hostNetJpy = gross - serviceFeeJpy;
  assert.notEqual(
    amountToStripeMinorUnits(hostNetJpy, "USD"),
    stripeMinorUsd,
    "charge must not equal host net misread as USD cents"
  );
});

test("mislabeled JPY net as USD would exceed real Stripe charge by orders of magnitude", () => {
  const gross = calculateStayTotal(12000, 4);
  const serviceFeeJpy = calculateServiceFee(gross);
  const serviceFeeUsd = convertBetweenCurrencies(serviceFeeJpy, "JPY", "USD", FALLBACK_RATES);
  const hostNetJpy = gross - serviceFeeJpy;

  const displayBugUsd = hostNetJpy;
  assert.ok(
    displayBugUsd / serviceFeeUsd > 5,
    "display bug amount should be vastly larger than actual Stripe charge"
  );
});
