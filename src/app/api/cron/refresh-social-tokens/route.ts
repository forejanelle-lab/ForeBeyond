import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getInstagramConnection } from "@/lib/social-media/connection";
import { refreshLongLivedToken } from "@/lib/social-media/meta-oauth";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/** Refreshes Instagram OAuth tokens before they expire. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const connection = await getInstagramConnection(supabase);

  if (!connection) {
    return NextResponse.json({ ok: true, refreshed: false, reason: "not_connected" });
  }

  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : null;
  const refreshThresholdMs = 7 * 24 * 60 * 60 * 1000;

  if (expiresAt && expiresAt - Date.now() > refreshThresholdMs) {
    return NextResponse.json({ ok: true, refreshed: false, reason: "not_due" });
  }

  try {
    const { accessToken, expiresIn } = await refreshLongLivedToken(connection.access_token);
    const tokenExpiresAt =
      expiresIn != null ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    const { error } = await supabase
      .from("social_platform_connections")
      .update({
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
      })
      .eq("id", connection.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, refreshed: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Token refresh failed." },
      { status: 500 }
    );
  }
}
