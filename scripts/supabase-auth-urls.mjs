/** Canonical production origin for auth redirects and email links. */
export const PRODUCTION_APP_URL = "https://forebeyond.com";

/** Supabase auth redirect allow list (production domain + previews + local dev). */
export function buildSupabaseAuthRedirectAllowList(appUrl = PRODUCTION_APP_URL) {
  const base = appUrl.replace(/\/$/, "");
  const wwwBase = base.replace("://forebeyond.com", "://www.forebeyond.com");

  const entries = [
    `${base}/auth/callback`,
    `${base}/auth/callback/**`,
    `${base}/auth/verify-email`,
    `${base}/auth/reset-password`,
    `${wwwBase}/auth/callback`,
    `${wwwBase}/auth/callback/**`,
    `${wwwBase}/auth/verify-email`,
    `${wwwBase}/auth/reset-password`,
    "https://*.vercel.app/auth/callback",
    "https://*.vercel.app/auth/callback/**",
    "https://*.vercel.app/auth/verify-email",
    "https://*.vercel.app/auth/reset-password",
    "http://localhost:3000/auth/callback",
    "http://localhost:3000/auth/callback/**",
    "http://localhost:3000/**",
  ];

  return [...new Set(entries)].join(",");
}
