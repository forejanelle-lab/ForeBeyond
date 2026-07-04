#!/usr/bin/env node
/**
 * Register (or verify) the Stripe webhook for stay service-fee payments.
 *
 * Requires STRIPE_SECRET_KEY in the environment or .env.local.
 *
 * Usage:
 *   npm run stripe:webhook
 *   npm run stripe:webhook -- --recreate   # delete + recreate to get a new signing secret
 *
 * Optional:
 *   NEXT_PUBLIC_APP_URL — defaults to https://forebeyond.com
 */
import Stripe from "stripe";
import { loadEnvLocal, requireEnv, upsertEnvLocal } from "./load-env-local.mjs";

const DEFAULT_APP_URL = "https://forebeyond.com";
const WEBHOOK_PATH = "/api/webhooks/stripe";
const ENABLED_EVENTS = ["payment_intent.succeeded"];

function getWebhookUrl() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || DEFAULT_APP_URL;
  return `${appUrl}${WEBHOOK_PATH}`;
}

async function main() {
  loadEnvLocal();

  const secretKey = requireEnv("STRIPE_SECRET_KEY");

  const webhookUrl = getWebhookUrl();
  const recreate = process.argv.includes("--recreate");
  const stripe = new Stripe(secretKey);

  const existing = await stripe.webhookEndpoints.list({ limit: 100 });
  const matches = existing.data.filter((endpoint) => endpoint.url === webhookUrl);

  if (matches.length > 0 && !recreate) {
    const endpoint = matches[0];
    console.log("Stripe webhook already registered:");
    console.log("  ID:", endpoint.id);
    console.log("  URL:", endpoint.url);
    console.log("  Status:", endpoint.status);
    console.log("  Events:", endpoint.enabled_events.join(", "));
    console.log("\nAdd the signing secret to your environment:");
    console.log("  STRIPE_WEBHOOK_SECRET=whsec_...");
    console.log("\nStripe only shows the secret when the endpoint is created.");
    console.log("To generate a new secret, run:");
    console.log("  npm run stripe:webhook -- --recreate");
    return;
  }

  if (matches.length > 0 && recreate) {
    for (const endpoint of matches) {
      await stripe.webhookEndpoints.del(endpoint.id);
      console.log("Deleted existing webhook:", endpoint.id);
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: ENABLED_EVENTS,
    description: "Fore Beyond stay service fee confirmations",
  });

  upsertEnvLocal("STRIPE_WEBHOOK_SECRET", endpoint.secret);

  console.log("Stripe webhook created:");
  console.log("  ID:", endpoint.id);
  console.log("  URL:", endpoint.url);
  console.log("  Events:", endpoint.enabled_events.join(", "));
  console.log("\nSaved to .env.local:");
  console.log(`  STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
