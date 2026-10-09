import { NextRequest, NextResponse } from "next/server";
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
  REFERRAL_QUERY_PARAM,
  isValidReferralCode,
  normalizeReferralCode,
} from "@/lib/referral";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await context.params;
  const code = normalizeReferralCode(raw);
  const home = request.nextUrl.clone();
  home.pathname = "/";
  home.search = "";

  if (!isValidReferralCode(code)) {
    return NextResponse.redirect(home);
  }

  home.searchParams.set(REFERRAL_QUERY_PARAM, code);
  const response = NextResponse.redirect(home);
  if (!request.cookies.get(REFERRAL_COOKIE_NAME)?.value) {
    response.cookies.set({
      name: REFERRAL_COOKIE_NAME,
      value: code,
      path: "/",
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}
