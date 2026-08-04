import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InstagramConnectionStatus,
  InstagramCredentials,
  SocialPlatformConnection,
} from "@/lib/social-media/types";

const PUBLIC_CONNECTION_FIELDS =
  "id, platform, token_expires_at, account_id, account_username, account_name, page_id, page_name, connected_by, connected_at, updated_at";

function getInstagramEnvCredentials(): InstagramCredentials | null {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  if (!accessToken || !businessAccountId) return null;
  return { accessToken, businessAccountId };
}

export async function getInstagramConnection(
  supabase: SupabaseClient
): Promise<SocialPlatformConnection | null> {
  const { data, error } = await supabase
    .from("social_platform_connections")
    .select("*")
    .eq("platform", "instagram")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as SocialPlatformConnection | null) ?? null;
}

export async function getInstagramConnectionStatus(
  supabase: SupabaseClient,
  connectedByEmail?: string | null
): Promise<InstagramConnectionStatus> {
  const connection = await getInstagramConnection(supabase);
  if (connection) {
    return {
      connected: true,
      source: "oauth",
      username: connection.account_username,
      accountName: connection.account_name,
      pageName: connection.page_name,
      connectedAt: connection.connected_at,
      expiresAt: connection.token_expires_at,
      connectedByEmail: connectedByEmail ?? null,
    };
  }

  const envCredentials = getInstagramEnvCredentials();
  if (envCredentials) {
    return {
      connected: true,
      source: "env",
      username: null,
      accountName: "Environment configuration",
      pageName: null,
    };
  }

  return { connected: false };
}

export async function resolveInstagramCredentials(
  supabase: SupabaseClient
): Promise<InstagramCredentials> {
  const connection = await getInstagramConnection(supabase);
  if (connection) {
    return {
      accessToken: connection.access_token,
      businessAccountId: connection.account_id,
    };
  }

  const envCredentials = getInstagramEnvCredentials();
  if (envCredentials) return envCredentials;

  throw new Error(
    "Instagram is not connected. Connect your account in Admin → Marketing → Social Media."
  );
}

export function isInstagramConfiguredSync(): boolean {
  return Boolean(getInstagramEnvCredentials());
}

export async function isInstagramConfigured(
  supabase: SupabaseClient
): Promise<boolean> {
  if (isInstagramConfiguredSync()) return true;
  const connection = await getInstagramConnection(supabase);
  return Boolean(connection);
}

export async function upsertInstagramConnection(
  supabase: SupabaseClient,
  input: {
    accessToken: string;
    tokenExpiresAt: string | null;
    accountId: string;
    accountUsername: string | null;
    accountName: string | null;
    pageId: string;
    pageName: string;
    connectedBy: string;
  }
): Promise<SocialPlatformConnection> {
  const row = {
    platform: "instagram" as const,
    access_token: input.accessToken,
    token_expires_at: input.tokenExpiresAt,
    account_id: input.accountId,
    account_username: input.accountUsername,
    account_name: input.accountName,
    page_id: input.pageId,
    page_name: input.pageName,
    connected_by: input.connectedBy,
    metadata: {},
  };

  const { data, error } = await supabase
    .from("social_platform_connections")
    .upsert(row, { onConflict: "platform" })
    .select(PUBLIC_CONNECTION_FIELDS + ", access_token")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save Instagram connection.");
  return data as unknown as SocialPlatformConnection;
}

export async function disconnectInstagram(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("social_platform_connections")
    .delete()
    .eq("platform", "instagram");

  if (error) throw new Error(error.message);
}

export async function getInstagramConnectionPublic(
  supabase: SupabaseClient
): Promise<Omit<SocialPlatformConnection, "access_token"> | null> {
  const { data, error } = await supabase
    .from("social_platform_connections")
    .select(PUBLIC_CONNECTION_FIELDS)
    .eq("platform", "instagram")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Omit<SocialPlatformConnection, "access_token"> | null) ?? null;
}
