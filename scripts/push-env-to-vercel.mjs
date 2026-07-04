#!/usr/bin/env node
/**
 * Push available integration secrets from .env.local to Vercel.
 * Skips empty values.
 */
import { spawnSync } from "node:child_process";
import { loadEnvLocal } from "./load-env-local.mjs";

const KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

const ENVIRONMENTS = ["production", "preview", "development"];

function pushVar(name, value, environment) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--force"],
    {
      input: value,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
    }
  );
  return result.status === 0;
}

function main() {
  loadEnvLocal();

  const toPush = KEYS.filter((key) => process.env[key]?.trim());
  if (toPush.length === 0) {
    console.error("No env vars to push.");
    process.exit(1);
  }

  console.log("Pushing to Vercel:", toPush.join(", "), "\n");

  for (const key of toPush) {
    const value = process.env[key].trim();
    for (const environment of ENVIRONMENTS) {
      console.log(`  ${key} → ${environment}`);
      if (!pushVar(key, value, environment)) {
        process.exit(1);
      }
    }
  }

  console.log("\nDone.");
}

main();
