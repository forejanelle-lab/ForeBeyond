/** Canonical app origin for auth emails and redirects (never localhost in production). */

import { PRODUCTION_SITE_URL } from "@/lib/site-metadata";

function normalizeOrigin(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(origin);
}

export function getAppUrl(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim() || process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${normalizeOrigin(host)}`;
  }

  if (requestOrigin) {
    const origin = normalizeOrigin(requestOrigin);
    if (!isLocalOrigin(origin)) {
      return origin;
    }
  }

  if (requestOrigin && process.env.NODE_ENV === "development") {
    return normalizeOrigin(requestOrigin);
  }

  return PRODUCTION_SITE_URL;
}

/** Base URL for links inside Supabase auth emails — never defaults to localhost. */
export function getAuthEmailAppUrl(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return normalizeOrigin(configured);
  }

  const vercelUrl =
    process.env.VERCEL_URL?.trim() || process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    return `https://${normalizeOrigin(host)}`;
  }

  if (requestOrigin) {
    const origin = normalizeOrigin(requestOrigin);
    if (!isLocalOrigin(origin)) {
      return origin;
    }
  }

  return PRODUCTION_SITE_URL;
}

export function getEmailVerificationRedirectUrl(requestOrigin?: string): string {
  const base = getAuthEmailAppUrl(requestOrigin);
  return `${base}/auth/callback?next=${encodeURIComponent("/auth/verify-email")}`;
}

export function getPasswordResetRedirectUrl(requestOrigin?: string): string {
  const base = getAuthEmailAppUrl(requestOrigin);
  return `${base}/auth/reset-password`;
}
