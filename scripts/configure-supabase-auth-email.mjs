#!/usr/bin/env node
/**
 * Configure Supabase Auth verification emails for production:
 * - Resend SMTP from hello@forebeyond.com
 * - Branded confirmation / recovery / magic-link templates
 * - Email confirmation required (mailer_autoconfirm: false)
 *
 * Requires:
 *   RESEND_API_KEY
 *   SUPABASE_ACCESS_TOKEN or `npx supabase login`
 *
 * Optional:
 *   NEXT_PUBLIC_APP_URL — production site URL (defaults to forebeyond.com)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildSupabaseAuthEmailConfig,
  BUSINESS_EMAIL,
  EMAIL_SENDER_NAME,
} from "./supabase-auth-email-templates.mjs";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";
import {
  buildSupabaseAuthRedirectAllowList,
  PRODUCTION_APP_URL,
} from "./supabase-auth-urls.mjs";

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

function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return configured || PRODUCTION_APP_URL;
}

async function main() {
  loadEnvLocal();
  const resendApiKey = requireEnv("RESEND_API_KEY");

  const appUrl = getAppUrl();
  const uriAllowList = buildSupabaseAuthRedirectAllowList(appUrl);

  const body = {
    site_url: appUrl,
    uri_allow_list: uriAllowList,
    external_email_enabled: true,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
    smtp_host: "smtp.resend.com",
    smtp_port: 465,
    smtp_user: "resend",
    smtp_pass: resendApiKey,
    smtp_admin_email: BUSINESS_EMAIL,
    smtp_sender_name: EMAIL_SENDER_NAME,
    ...buildSupabaseAuthEmailConfig(),
  };

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
    console.error("Failed to configure Supabase auth email:", res.status, text);
    process.exit(1);
  }

  console.log("Supabase auth email configured:");
  console.log("  Site URL:", appUrl);
  console.log("  From:", `${EMAIL_SENDER_NAME} <${BUSINESS_EMAIL}>`);
  console.log("  SMTP: smtp.resend.com:465 (Resend)");
  console.log("  Email confirmation: required");
  console.log("  Templates: confirmation, recovery, magic link");
  console.log("\nNext steps:");
  console.log("  1. If Resend domain is pending, finish DNS (npm run resend:domain to recheck)");
  console.log("  2. Set RESEND_FROM_EMAIL=Fore Beyond <hello@forebeyond.com> in Vercel");
  console.log("  3. Raise Auth email rate limits in Supabase if needed (default 30/hour after SMTP setup)");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
