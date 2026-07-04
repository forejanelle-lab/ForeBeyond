import { getEmailVerificationRedirectUrl, getPasswordResetRedirectUrl } from "@/lib/app-url";

/** Resolve the redirect URL Supabase should embed in verification emails. */
export async function fetchEmailVerificationRedirectUrl(): Promise<string> {
  try {
    const res = await fetch("/api/auth/email-redirect-url", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { redirectTo?: string };
      if (data.redirectTo) return data.redirectTo;
    }
  } catch {
    // Fall through to client-side resolution (local dev without API).
  }

  return getEmailVerificationRedirectUrl(
    typeof window !== "undefined" ? window.location.origin : undefined
  );
}

/** Resolve the redirect URL Supabase should embed in password reset emails. */
export async function fetchPasswordResetRedirectUrl(): Promise<string> {
  try {
    const res = await fetch("/api/auth/password-reset-redirect-url", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { redirectTo?: string };
      if (data.redirectTo) return data.redirectTo;
    }
  } catch {
    // Fall through to client-side resolution (local dev without API).
  }

  return getPasswordResetRedirectUrl(
    typeof window !== "undefined" ? window.location.origin : undefined
  );
}
