import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordLoginAudit } from "@/lib/record-login-audit";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") ?? "/auth/verify-email";
  const origin = requestUrl.origin;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/auth/verify-email";
  const isPasswordReset = safeNext.includes("reset-password");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        await recordLoginAudit("email_link");
      } catch (auditError) {
        console.error("recordLoginAudit failed:", auditError);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      try {
        await recordLoginAudit(type ?? "email_link");
      } catch (auditError) {
        console.error("recordLoginAudit failed:", auditError);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (isPasswordReset) {
    return NextResponse.redirect(`${origin}/auth/reset-password?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=verification`);
}
