#!/usr/bin/env node
/**
 * Updates Supabase Auth Site URL + redirect allow list for Fore Beyond production.
 * Requires SUPABASE_ACCESS_TOKEN or `supabase login` (~/.supabase/access-token).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_REF = "pudfethylijrfilcihgp";
const APP_URL = "https://fore-beyond-fore-stay.vercel.app";

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

const uriAllowList = [
  `${APP_URL}/auth/callback`,
  `${APP_URL}/auth/callback/**`,
  `${APP_URL}/auth/verify-email`,
  "https://*.vercel.app/auth/callback",
  "https://*.vercel.app/auth/callback/**",
  "https://*.vercel.app/auth/verify-email",
  "http://localhost:3000/auth/callback",
  "http://localhost:3000/auth/callback/**",
  "http://localhost:3000/**",
].join(",");

const token = getAccessToken();

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_url: APP_URL,
    uri_allow_list: uriAllowList,
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Failed to update Supabase auth config:", res.status, body);
  process.exit(1);
}

console.log("Supabase auth URLs updated:");
console.log("  Site URL:", APP_URL);
console.log("  Redirect URLs: callback + verify-email (production, preview, localhost)");
