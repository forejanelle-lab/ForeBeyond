import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSocialMediaPanel } from "@/components/admin/social-media/AdminSocialMediaPanel";
import { InstagramConnectionCard } from "@/components/admin/social-media/InstagramConnectionCard";
import { getInstagramConnectionStatus } from "@/lib/social-media/connection";
import { getAppBaseUrl, isInstagramAppConfigured } from "@/lib/social-media/meta-oauth";
import { PRODUCTION_SITE_URL } from "@/lib/site-metadata";
import type { SocialPost } from "@/lib/social-media/types";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Social Media",
  description: "AI-powered Instagram content manager for Fore Beyond.",
  path: "/admin/marketing/social-media",
});

const FLASH_ERRORS: Record<string, string> = {
  oauth_denied: "Instagram connection was cancelled.",
  invalid_state: "Connection session expired. Please try again.",
  unauthorized: "Sign in as an admin to connect Instagram.",
  forbidden: "Only platform admins can connect Instagram.",
  meta_not_configured: "Instagram app credentials are not configured on the server.",
  connect_failed:
    "Could not connect Instagram. Use a Business or Creator account and grant publishing permissions.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSocialMediaPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const connectionStatus = await getInstagramConnectionStatus(supabase, user?.email ?? null);
  const metaAppReady = isInstagramAppConfigured();
  const oauthRedirectUris = [
    process.env.INSTAGRAM_REDIRECT_URI?.trim(),
    `${PRODUCTION_SITE_URL}/api/admin/social-media/callback`,
    `https://www.forebeyond.com/api/admin/social-media/callback`,
    getAppBaseUrl() !== PRODUCTION_SITE_URL
      ? `${getAppBaseUrl()}/api/admin/social-media/callback`
      : null,
  ].filter((uri, index, all): uri is string => Boolean(uri) && all.indexOf(uri) === index);
  const instagramAppId = process.env.INSTAGRAM_APP_ID?.trim() ?? null;

  const connected = params.connected === "1";
  const errorCode = typeof params.error === "string" ? params.error : null;
  const errorDetail = typeof params.message === "string" ? params.message : null;

  const flashMessage = connected ? "Instagram account connected successfully." : null;
  const flashError = errorCode
    ? errorDetail ?? FLASH_ERRORS[errorCode] ?? "Instagram connection failed."
    : null;

  return (
    <AdminShell
      wide
      title="Social Media"
      description="Generate, review, approve, and schedule premium Instagram content for Fore Beyond."
    >
      <InstagramConnectionCard
        status={connectionStatus}
        metaAppReady={metaAppReady}
        oauthRedirectUris={oauthRedirectUris}
        instagramAppId={instagramAppId}
        flashMessage={flashMessage}
        flashError={flashError}
      />
      <AdminSocialMediaPanel posts={(posts as SocialPost[]) ?? []} />
    </AdminShell>
  );
}
