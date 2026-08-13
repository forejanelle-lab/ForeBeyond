#!/usr/bin/env node
/**
 * Apply Host Finder migration 075 (host_searches, host_leads, signal library, etc.)
 *
 * Usage:
 *   npm run db:migrate-host-finder
 *   npm run db:migrate-host-finder -- --verify
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MIGRATION = path.join(ROOT, "supabase/migrations/075_host_finder.sql");
const SUPABASE_SQL =
  "https://supabase.com/dashboard/project/pudfethylijrfilcihgp/sql/new";

function log(title, ...lines) {
  console.log(`\n=== ${title} ===\n`);
  for (const line of lines) console.log(line);
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
  if (!existsSync(MIGRATION)) {
    console.error("Missing migration file:", MIGRATION);
    return false;
  }
  const sql = readFileSync(MIGRATION, "utf8");
  if (process.platform === "darwin") {
    spawnSync("pbcopy", { input: sql, encoding: "utf8" });
    return true;
  }
  console.log("Copy this file manually:", MIGRATION);
  return false;
}

async function checkMigrationApplied() {
  loadEnvLocal(ROOT, { force: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/"/g, "").trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/host_searches?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  return res.ok;
}

function resolveDatabaseUrl() {
  loadEnvLocal(ROOT, { force: true });
  const existing = process.env.DATABASE_URL?.trim();
  if (existing) return existing;

  const password =
    process.env.SUPABASE_DB_PASSWORD?.trim() || process.env.DATABASE_PASSWORD?.trim();
  if (!password) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const ref = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) return null;

  const host = process.env.DATABASE_HOST?.trim() || "aws-1-us-east-1.pooler.supabase.com";
  const user = process.env.DATABASE_USER?.trim() || `postgres.${ref}`;
  const port = process.env.DATABASE_PORT?.trim() || "5432";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
}

async function runMigrationIfPossible() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) return false;

  process.env.DATABASE_URL = databaseUrl;

  log("Host Finder migration 075", "Running via DATABASE_URL...");
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "run-sql.mjs"), "supabase/migrations/075_host_finder.sql"],
    { stdio: "inherit", cwd: ROOT, env: process.env }
  );
  return result.status === 0;
}

async function main() {
  const verifyOnly = process.argv.includes("--verify");
  loadEnvLocal(ROOT, { force: true });

  const applied = await checkMigrationApplied();
  if (applied === null) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  if (verifyOnly) {
    console.log(applied ? "✓ Host Finder tables exist." : "✗ Migration 075 not applied.");
    process.exit(applied ? 0 : 1);
  }

  if (applied) {
    console.log("✓ Host Finder migration already applied.");
    return;
  }

  const ran = await runMigrationIfPossible();
  if (ran) {
    const ok = await checkMigrationApplied();
    if (ok) {
      console.log("\n✓ Host Finder migration applied successfully.");
      return;
    }
    console.error("\nMigration ran but host_searches is still missing. Reload Supabase schema cache and retry.");
    process.exit(1);
  }

  log(
    "Host Finder migration 075",
    "No DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local — cannot run SQL automatically.",
    "",
    "Quick fix:",
    "  1. Supabase → Project Settings → Database → copy your database password",
    "  2. Add to .env.local: SUPABASE_DB_PASSWORD=your_password",
    "  3. Re-run: npm run db:migrate-host-finder",
    "",
    "Or paste manually in the SQL Editor (opening now):",
    MIGRATION
  );

  if (copyMigrationToClipboard()) {
    console.log("Migration SQL copied to clipboard.");
  }

  openUrl(SUPABASE_SQL);
  console.log("\nAfter running the SQL, verify with: npm run db:migrate-host-finder -- --verify");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
