import { getEmailVerificationRedirectUrl } from "@/lib/app-url";

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
