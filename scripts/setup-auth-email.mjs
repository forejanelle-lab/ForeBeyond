#!/usr/bin/env node
/**
 * Full auth email setup:
 * 1. Register / verify forebeyond.com in Resend (DNS records printed if pending)
 * 2. Configure Supabase Auth SMTP + branded templates from hello@forebeyond.com
 *
 * Requires in .env.local or environment:
 *   RESEND_API_KEY
 *   SUPABASE_ACCESS_TOKEN or `npx supabase login`
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runStep(label, scriptName, extraArgs = []) {
  console.log(`\n=== ${label} ===\n`);
  const scriptPath = path.join(__dirname, scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const loaded = loadEnvLocal();
  if (!loaded) {
    console.warn("No .env.local found. Create one with RESEND_API_KEY before running.\n");
  }

  runStep("Resend domain (forebeyond.com)", "setup-resend-domain.mjs");
  runStep("Supabase auth email (hello@forebeyond.com)", "configure-supabase-auth-email.mjs");

  console.log("\nAuth email setup complete.");
  console.log("If Resend domain status is still pending, finish DNS at your registrar, then run:");
  console.log("  npm run resend:domain");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
