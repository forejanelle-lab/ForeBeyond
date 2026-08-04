import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { upsertInstagramConnection } from "@/lib/social-media/connection";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
  isInstagramAppConfigured,
} from "@/lib/social-media/meta-oauth";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "ig_oauth_state";
const ADMIN_SOCIAL_PATH = "/admin/marketing/social-media";

function redirectWithMessage(params: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const url = new URL(`${base}${ADMIN_SOCIAL_PATH}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
  if (!isInstagramAppConfigured()) {
    return redirectWithMessage({ error: "meta_not_configured" });
  }

  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return redirectWithMessage({ error: "oauth_denied" });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithMessage({ error: "invalid_state" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage({ error: "unauthorized" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Pick<Profile, "id" | "email" | "is_admin"> | null;
  if (!isPlatformAdmin(user.email ?? "", typedProfile?.is_admin ?? false)) {
    return redirectWithMessage({ error: "forbidden" });
  }

  try {
    const { accessToken: shortToken } = await exchangeCodeForShortLivedToken(code);
    const { accessToken, expiresIn } = await exchangeForLongLivedToken(shortToken);
    const igProfile = await getInstagramProfile(accessToken);

    const tokenExpiresAt =
      expiresIn != null ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    await upsertInstagramConnection(supabase, {
      accessToken,
      tokenExpiresAt,
      accountId: igProfile.id,
      accountUsername: igProfile.username,
      accountName: igProfile.name,
      pageId: "",
      pageName: "",
      connectedBy: user.id,
    });

    return redirectWithMessage({ connected: "1" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return redirectWithMessage({ error: "connect_failed", message });
  }
}
