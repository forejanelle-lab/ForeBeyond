#!/usr/bin/env node
/**
 * Send a password reset email via Supabase (uses anon key + Resend SMTP).
 * Usage: node scripts/send-password-reset.mjs [email]
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal, requireEnv } from "./load-env-local.mjs";
import { PRODUCTION_APP_URL } from "./supabase-auth-urls.mjs";

const email = (process.argv[2] ?? "forejanelle@gmail.com").trim().toLowerCase();
const redirectTo = `${PRODUCTION_APP_URL.replace(/\/$/, "")}/auth/reset-password`;

loadEnvLocal();

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const supabase = createClient(url, anonKey);

const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

if (error) {
  console.error("Failed to send reset email:", error.message);
  process.exit(1);
}

console.log(`Password reset email requested for ${email}`);
console.log(`Redirect URL in email: ${redirectTo}`);
console.log("Check inbox and spam (from hello@forebeyond.com via Resend).");
