const INSTAGRAM_GRAPH_VERSION = "v21.0";
const INSTAGRAM_GRAPH_BASE = `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}`;

/** Instagram Login scopes (Business Login for Instagram). */
export const INSTAGRAM_OAUTH_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
].join(",");

export function getInstagramAppConfig(redirectUri?: string) {
  const appId =
    process.env.INSTAGRAM_APP_ID?.trim() ?? process.env.META_APP_ID?.trim();
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET?.trim() ?? process.env.META_APP_SECRET?.trim();
  const resolvedRedirect = redirectUri ?? getInstagramRedirectUri();

  if (!appId || !appSecret) {
    throw new Error(
      "Instagram app is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET."
    );
  }

  return { appId, appSecret, redirectUri: resolvedRedirect };
}

export function isInstagramAppConfigured(): boolean {
  return Boolean(
    (process.env.INSTAGRAM_APP_ID?.trim() || process.env.META_APP_ID?.trim()) &&
      (process.env.INSTAGRAM_APP_SECRET?.trim() || process.env.META_APP_SECRET?.trim()) &&
      getAppBaseUrl()
  );
}

/** @deprecated Use isInstagramAppConfigured */
export const isMetaAppConfigured = isInstagramAppConfigured;

export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) return "";
  return url.replace(/\/$/, "");
}

export function getInstagramRedirectUri(request?: Request): string {
  if (request) {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host")?.trim();
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    if (host && !host.includes("localhost")) {
      return `${proto}://${host}/api/admin/social-media/callback`;
    }
  }

  const override =
    process.env.INSTAGRAM_REDIRECT_URI?.trim() ?? process.env.META_REDIRECT_URI?.trim();
  if (override) return override.replace(/\/$/, "");

  const base = getAppBaseUrl();
  if (!base) {
    throw new Error("Set NEXT_PUBLIC_APP_URL or INSTAGRAM_REDIRECT_URI for Instagram OAuth.");
  }
  return `${base}/api/admin/social-media/callback`;
}

/** Opens Instagram login — no Facebook Page required. */
export function buildInstagramOAuthUrl(state: string, redirectUri?: string): string {
  const { appId } = getInstagramAppConfig();
  const resolvedRedirect = redirectUri ?? getInstagramRedirectUri();

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: resolvedRedirect,
    scope: INSTAGRAM_OAUTH_SCOPES,
    response_type: "code",
    state,
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

interface GraphError {
  message?: string;
  type?: string;
  code?: number;
}

async function parseJson<T>(response: Response): Promise<T & { error?: GraphError }> {
  return (await response.json()) as T & { error?: GraphError };
}

export async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri?: string
): Promise<{
  accessToken: string;
  userId: string;
}> {
  const { appId, appSecret, redirectUri: resolvedRedirect } = getInstagramAppConfig(redirectUri);

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: resolvedRedirect,
      code,
    }),
  });

  const data = await parseJson<{ access_token: string; user_id: string }>(response);
  if (!response.ok || !data.access_token || !data.user_id) {
    throw new Error(data.error?.message ?? "Failed to exchange Instagram authorization code.");
  }

  return { accessToken: data.access_token, userId: data.user_id };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number | null;
}> {
  const { appSecret } = getInstagramAppConfig();
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const response = await fetch(url.toString());
  const data = await parseJson<{ access_token: string; expires_in?: number }>(response);

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Failed to obtain long-lived Instagram token.");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? null,
  };
}

export async function getInstagramProfile(accessToken: string): Promise<{
  id: string;
  username: string | null;
  name: string | null;
}> {
  const url = new URL(`${INSTAGRAM_GRAPH_BASE}/me`);
  url.searchParams.set("fields", "id,username,name");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  const data = await parseJson<{ id: string; username?: string; name?: string }>(response);

  if (!response.ok || !data.id) {
    throw new Error(data.error?.message ?? "Failed to load Instagram profile.");
  }

  return {
    id: data.id,
    username: data.username ?? null,
    name: data.name ?? null,
  };
}

export async function refreshLongLivedToken(currentToken: string): Promise<{
  accessToken: string;
  expiresIn: number | null;
}> {
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);

  const response = await fetch(url.toString());
  const data = await parseJson<{ access_token: string; expires_in?: number }>(response);

  if (!response.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Failed to refresh Instagram token.");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? null,
  };
}
