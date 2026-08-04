#!/usr/bin/env node
/**
 * Instagram API setup for Fore Beyond admin social media publishing.
 *
 * Guides Meta Developer app creation (Instagram Login), writes .env.local,
 * applies DB migration 074, validates config, and optionally pushes to Vercel.
 *
 * Usage:
 *   npm run instagram:setup              # interactive wizard
 *   npm run instagram:setup -- --guide   # open Meta dashboards + migration only
 *   npm run instagram:setup -- --verify  # check existing config
 *
 * Pass credentials non-interactively:
 *   INSTAGRAM_APP_ID=... INSTAGRAM_APP_SECRET=... npm run instagram:setup
 */
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, upsertEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MIGRATION_074 = path.join(ROOT, "supabase/migrations/074_social_platform_connections.sql");
const SUPABASE_SQL =
  "https://supabase.com/dashboard/project/pudfethylijrfilcihgp/sql/new";

const META_CREATE_APP = "https://developers.facebook.com/apps/create/";
const META_APPS = "https://developers.facebook.com/apps/";

function log(title, ...lines) {
  console.log(`\n=== ${title} ===\n`);
  for (const line of lines) console.log(line);
}

function getAppBaseUrl() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  return url || "http://localhost:3000";
}

function getRedirectUris() {
  const local = "http://localhost:3000/api/admin/social-media/callback";
  const prod = "https://forebeyond.com/api/admin/social-media/callback";
  const base = getAppBaseUrl();
  const custom =
    base !== "http://localhost:3000" && base !== "https://forebeyond.com"
      ? [`${base}/api/admin/social-media/callback`]
      : [];
  return [...new Set([local, prod, ...custom])];
}

function openUrl(url) {
  if (process.platform === "darwin") {
    spawnSync("open", [url], { stdio: "ignore" });
  } else if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  } else {
    spawnSync("xdg-open", [url], { stdio: "ignore" });
  }
}

function copyMigrationToClipboard() {
  if (!fs.existsSync(MIGRATION_074)) {
    console.error("Missing migration file:", MIGRATION_074);
    return false;
  }
  const sql = fs.readFileSync(MIGRATION_074, "utf8");
  if (process.platform === "darwin") {
    spawnSync("pbcopy", { input: sql, encoding: "utf8" });
    return true;
  }
  console.log("Copy this file manually:", MIGRATION_074);
  return false;
}

async function checkMigrationApplied() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/"/g, "").trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/social_platform_connections?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  return res.ok;
}

async function runMigrationIfPossible() {
  loadEnvLocal();
  if (process.env.DATABASE_URL?.trim()) {
    log("Database migration 074", "Running via DATABASE_URL...");
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, "run-sql.mjs"), "supabase/migrations/074_social_platform_connections.sql"],
      { stdio: "inherit", cwd: ROOT, env: process.env }
    );
    return result.status === 0;
  }
  return false;
}

function ensureCronSecret() {
  loadEnvLocal();
  if (!process.env.CRON_SECRET?.trim()) {
    const secret = randomBytes(32).toString("hex");
    upsertEnvLocal("CRON_SECRET", secret);
    console.log("Generated CRON_SECRET in .env.local");
  }
}

function writeInstagramEnv(appId, appSecret) {
  upsertEnvLocal("INSTAGRAM_APP_ID", appId);
  upsertEnvLocal("INSTAGRAM_APP_SECRET", appSecret);

  const base = getAppBaseUrl();
  const redirect = `${base}/api/admin/social-media/callback`;
  upsertEnvLocal("INSTAGRAM_REDIRECT_URI", redirect);
}

function printMetaSetupChecklist() {
  const redirects = getRedirectUris();

  log(
    "Meta Developer — create Instagram app",
    "Follow these steps in the browser tabs that just opened:",
    "",
    "1. Create App → type: Business",
    "   App name: Fore Beyond Social",
    "   Contact email: your email",
    "",
    "2. Add product: Instagram Platform",
    "   Choose: Instagram API with Instagram Login",
    "",
    "3. Instagram → API setup with Instagram login → Business login settings",
    "   Add these Valid OAuth Redirect URIs (copy all):"
  );

  for (const uri of redirects) {
    console.log(`     ${uri}`);
  }

  console.log(`
4. Instagram → API setup → copy:
   • Instagram App ID  → INSTAGRAM_APP_ID
   • Instagram App Secret → INSTAGRAM_APP_SECRET

5. App roles: add yourself as Admin/Developer on the app

6. Permissions (should be requested via OAuth automatically):
   • instagram_business_basic
   • instagram_business_content_publish

7. Your Instagram account must be Professional (Business or Creator):
   Instagram app → Settings → Account type → Switch to professional account
`);
}

async function promptCredentials() {
  const rl = createInterface({ input, output });

  console.log("\nPaste credentials from Meta Developer → Instagram → API setup\n");

  const appId = (process.env.INSTAGRAM_APP_ID || (await rl.question("Instagram App ID: "))).trim();
  const appSecret = (
    process.env.INSTAGRAM_APP_SECRET || (await rl.question("Instagram App Secret: "))
  ).trim();

  await rl.close();

  if (!appId || !appSecret) {
    console.error("\nBoth App ID and App Secret are required.");
    process.exit(1);
  }

  if (!/^\d+$/.test(appId)) {
    console.warn(
      "\nWarning: Instagram App ID is usually numeric. If OAuth fails, double-check you copied the Instagram App ID (not Facebook App ID or an AI key)."
    );
  }

  return { appId, appSecret };
}

async function verifyConfig() {
  loadEnvLocal();
  const appId = process.env.INSTAGRAM_APP_ID?.trim() || process.env.META_APP_ID?.trim();
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET?.trim() || process.env.META_APP_SECRET?.trim();
  const base = getAppBaseUrl();

  log("Verification");

  console.log(`NEXT_PUBLIC_APP_URL: ${base}`);
  console.log(`Redirect URI: ${base}/api/admin/social-media/callback`);
  console.log(`INSTAGRAM_APP_ID: ${appId ? `${appId.slice(0, 4)}…` : "MISSING"}`);
  console.log(`INSTAGRAM_APP_SECRET: ${appSecret ? "set" : "MISSING"}`);
  console.log(`CRON_SECRET: ${process.env.CRON_SECRET?.trim() ? "set" : "MISSING"}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY?.trim() ? "set" : "MISSING"}`);

  const migrationOk = await checkMigrationApplied();
  if (migrationOk === null) {
    console.log("Migration 074: could not check (missing Supabase env)");
  } else {
    console.log(`Migration 074 (social_platform_connections): ${migrationOk ? "OK" : "NOT APPLIED"}`);
  }

  const ok = Boolean(appId && appSecret && migrationOk);
  if (ok) {
    console.log("\n✓ Ready. Open Admin → Marketing → Social Media → Connect Instagram");
  } else {
    console.log("\n✗ Setup incomplete. Run: npm run instagram:setup");
  }

  return ok;
}

async function pushToVercel() {
  loadEnvLocal();
  const keys = [
    "INSTAGRAM_APP_ID",
    "INSTAGRAM_APP_SECRET",
    "INSTAGRAM_REDIRECT_URI",
    "CRON_SECRET",
    "OPENAI_API_KEY",
  ].filter((k) => process.env[k]?.trim());

  if (keys.length === 0) return;

  log("Push to Vercel", keys.join(", "));

  for (const key of keys) {
    for (const env of ["production", "preview", "development"]) {
      console.log(`  ${key} → ${env}`);
      const result = spawnSync(
        "npx",
        ["vercel", "env", "add", key, env, "--force"],
        { input: process.env[key].trim(), encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] }
      );
      if (result.status !== 0) {
        console.warn(`  Failed to push ${key} (${env}) — run manually or: npx vercel login`);
        return;
      }
    }
  }

  console.log("\nVercel env updated. Redeploy: npx vercel --prod");
}

async function main() {
  const args = new Set(process.argv.slice(2));
  loadEnvLocal();

  if (args.has("--verify")) {
    const ok = await verifyConfig();
    process.exit(ok ? 0 : 1);
  }

  log(
    "Fore Beyond — Instagram API setup",
    "This configures Instagram Login for Admin → Marketing → Social Media.",
    "You must complete Meta Developer steps in your browser (one-time)."
  );

  ensureCronSecret();

  if (args.has("--guide")) {
    openUrl(META_CREATE_APP);
    openUrl(META_APPS);
    printMetaSetupChecklist();
  } else {
    openUrl(META_CREATE_APP);
    printMetaSetupChecklist();
  }

  const migrationApplied = await checkMigrationApplied();
  if (migrationApplied) {
    console.log("\n✓ Migration 074 already applied.");
  } else {
    const ran = await runMigrationIfPossible();
    if (!ran) {
      log(
        "Database migration 074",
        "Opening Supabase SQL Editor — paste (Cmd+V) and Run:",
        MIGRATION_074
      );
      if (copyMigrationToClipboard()) console.log("Migration SQL copied to clipboard.");
      openUrl(SUPABASE_SQL);
    }
  }

  if (process.env.INSTAGRAM_APP_ID?.trim() && process.env.INSTAGRAM_APP_SECRET?.trim()) {
    console.log("\nInstagram credentials already in .env.local — skipping prompt.");
  } else if (!args.has("--guide")) {
    const { appId, appSecret } = await promptCredentials();
    writeInstagramEnv(appId, appSecret);
    console.log("\n✓ Saved INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI to .env.local");
  }

  await verifyConfig();

  if (!args.has("--guide") && process.env.INSTAGRAM_APP_ID?.trim()) {
    const rl = createInterface({ input, output });
    const push = await rl.question("\nPush Instagram secrets to Vercel? [y/N] ");
    await rl.close();
    if (push.trim().toLowerCase() === "y") {
      await pushToVercel();
    }
  }

  console.log("\nNext: restart dev server, then Admin → Marketing → Social Media → Connect Instagram");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
