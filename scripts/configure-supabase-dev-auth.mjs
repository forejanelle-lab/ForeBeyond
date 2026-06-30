#!/usr/bin/env node
/**
 * Dev-only: disable email confirmation (mailer_autoconfirm) on the hosted Supabase project.
 * Re-enable before production with: npm run supabase:auth-confirm-email
 *
 * Requires SUPABASE_ACCESS_TOKEN or `npx supabase login`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_REF = "pudfethylijrfilcihgp";

function getAccessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }

  const tokenPath = path.join(os.homedir(), ".supabase", "access-token");
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, "utf8").trim();
  }

  throw new Error(
    "No Supabase access token. Run `npx supabase login` or set SUPABASE_ACCESS_TOKEN."
  );
}

async function patchAuthConfig(body) {
  const token = getAccessToken();
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Failed to update Supabase auth config:", res.status, text);
    process.exit(1);
  }

  return text ? JSON.parse(text) : {};
}

const enable = process.argv.includes("--enable");

const config = await patchAuthConfig({ mailer_autoconfirm: !enable });

console.log(
  enable
    ? "Email confirmation enabled (mailer_autoconfirm: false)"
    : "Email confirmation disabled for development (mailer_autoconfirm: true)"
);
console.log("  Project:", PROJECT_REF);
if (config.mailer_autoconfirm != null) {
  console.log("  mailer_autoconfirm:", config.mailer_autoconfirm);
}
if (!enable) {
  console.log("\nRe-enable before production: npm run supabase:auth-confirm-email");
}
