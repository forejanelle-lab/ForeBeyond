#!/usr/bin/env node
/**
 * One-shot setup: validate secrets, register Stripe webhook, configure auth email, push to Vercel.
 *
 * Fill .env.local first:
 *   STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
 *
 * Usage: npm run setup:integrations
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(process.cwd(), ".env.local");

const REQUIRED = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
];

function run(label, script) {
  console.log(`\n=== ${label} ===\n`);
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function upsertEnv(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  const line = `${key}=${value.includes(" ") ? `"${value}"` : value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    content = `${content.trim()}\n${line}\n`;
  }

  fs.writeFileSync(ENV_PATH, content);
  process.env[key] = value;
}

function main() {
  loadEnvLocal();

  for (const key of REQUIRED) {
    const value = process.env[key]?.trim();
    if (!value) {
      console.error(`Missing ${key} in .env.local`);
      console.error("\nAdd keys from:");
      console.error("  Stripe: https://dashboard.stripe.com/apikeys");
      console.error("  Resend: https://resend.com/api-keys");
      console.error("  Supabase service_role: Dashboard → Settings → API");
      process.exit(1);
  }
  }

  if (!process.env.RESEND_FROM_EMAIL?.trim()) {
    upsertEnv("RESEND_FROM_EMAIL", "Fore Beyond <hello@forebeyond.com>");
  }

  run("Resend domain (forebeyond.com)", "setup-resend-domain.mjs");
  run("Stripe webhook", "setup-stripe-webhook.mjs");

  // setup-stripe-webhook prints STRIPE_WEBHOOK_SECRET — re-read .env.local if user added manually
  loadEnvLocal();

  run("Supabase auth email", "configure-supabase-auth-email.mjs");
  run("Push secrets to Vercel", "push-env-to-vercel.mjs");

  console.log("\nIntegration setup complete.");
  console.log("Redeploy: npx vercel --prod");
}

main();
