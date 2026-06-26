import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmailVerificationRedirectUrl } from "@/lib/app-url";

export async function resendVerificationEmail(
  supabase: SupabaseClient,
  email: string,
  redirectTo?: string
) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { error: "Enter your email address." };
  }

  const emailRedirectTo =
    redirectTo ?? getEmailVerificationRedirectUrl(typeof window !== "undefined" ? window.location.origin : undefined);

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: trimmed,
    options: { emailRedirectTo },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export function isEmailNotConfirmedError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed") ||
    lower.includes("not verified")
  );
}
