import { NextResponse } from "next/server";
import { getEmailVerificationRedirectUrl } from "@/lib/app-url";

/** Server-side canonical redirect for Supabase auth emails (uses request host + env). */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectTo = getEmailVerificationRedirectUrl(origin);

  return NextResponse.json({ redirectTo });
}
