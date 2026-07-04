import { NextResponse } from "next/server";
import { getPasswordResetRedirectUrl } from "@/lib/app-url";

/** Server-side canonical redirect for Supabase password reset emails. */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectTo = getPasswordResetRedirectUrl(origin);

  return NextResponse.json({ redirectTo });
}
