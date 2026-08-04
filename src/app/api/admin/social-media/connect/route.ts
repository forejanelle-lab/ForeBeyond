import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { buildInstagramOAuthUrl, isInstagramAppConfigured } from "@/lib/social-media/meta-oauth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ig_oauth_state";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  if (!isInstagramAppConfigured()) {
    return NextResponse.json(
      {
        error:
          "Instagram app is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.",
      },
      { status: 503 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(buildInstagramOAuthUrl(state));
}
