import type { SupabaseClient } from "@supabase/supabase-js";
import { PRODUCTION_SITE_URL } from "@/lib/site-metadata";

export const REFERRAL_QUERY_PARAM = "ref";
export const REFERRAL_COOKIE_NAME = "fb_ref";
export const REFERRAL_STORAGE_KEY = "fb_ref";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

const CODE_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function normalizeReferralCode(value: string) {
  return value.trim().toLowerCase();
}

export function isValidReferralCode(value: string) {
  return value.length >= 2 && value.length <= 48 && CODE_PATTERN.test(value);
}

export function slugifyReferralCode(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return isValidReferralCode(slug) ? slug : "";
}

export function formatReferralAttribution(link: { name: string; code: string }) {
  return `${link.name} (${link.code})`;
}

export function buildReferralPath(code: string) {
  return `/r/${encodeURIComponent(normalizeReferralCode(code))}`;
}

export function getReferralShareOrigin() {
  return PRODUCTION_SITE_URL.replace(/\/$/, "");
}

export function buildReferralUrl(origin: string, code: string) {
  return `${origin.replace(/\/$/, "")}${buildReferralPath(code)}`;
}

/** Public URL to share with partners — always the live site, never localhost. */
export function buildShareReferralUrl(code: string) {
  return buildReferralUrl(getReferralShareOrigin(), code);
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredReferralCode() {
  const fromCookie = readCookie(REFERRAL_COOKIE_NAME);
  if (fromCookie && isValidReferralCode(fromCookie)) return fromCookie;
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(REFERRAL_STORAGE_KEY);
    return stored && isValidReferralCode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredReferralCode(code: string) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return;
  if (getStoredReferralCode()) return;

  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure ? "; Secure" : ""}`;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
  } catch {
    // Ignore quota / private-mode failures; the cookie is enough.
  }
}

export async function resolveActiveReferralLinkId(supabase: SupabaseClient) {
  const code = getStoredReferralCode();
  if (!code) return null;

  const { data, error } = await supabase
    .from("referral_links")
    .select("id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return null;
  return (data as { id: string } | null)?.id ?? null;
}
