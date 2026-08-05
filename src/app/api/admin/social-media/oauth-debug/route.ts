import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import {
  buildInstagramOAuthUrl,
  getInstagramAppConfig,
  getInstagramRedirectUri,
  INSTAGRAM_OAUTH_SCOPES,
  isInstagramAppConfigured,
} from "@/lib/social-media/meta-oauth";

export const dynamic = "force-dynamic";

/** Admin-only: shows OAuth params used for Instagram connect (no secrets). */
export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  if (!isInstagramAppConfigured()) {
    return NextResponse.json({ error: "Instagram app not configured" }, { status: 503 });
  }

  const redirectUri = getInstagramRedirectUri(request);
  const { appId } = getInstagramAppConfig(redirectUri);
  const authorizeUrl = buildInstagramOAuthUrl("debug-state", redirectUri);

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    null;

  return NextResponse.json({
    ok: true,
    requestHost: host,
    appId,
    redirectUri,
    scopes: INSTAGRAM_OAUTH_SCOPES,
    authorizeUrl,
    env: {
      instagramRedirectUri: process.env.INSTAGRAM_REDIRECT_URI?.trim() || null,
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || null,
    },
    metaChecklist: [
      "Meta → ForeBeyond-IG → Instagram → API setup with Instagram Login",
      "Business login settings → Valid OAuth redirect URIs",
      `Must include exactly: ${redirectUri}`,
      "Also add www variant if you browse with www",
    ],
  });
}
