import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

type SessionResult = { ok: true } | { ok: false; error: string };

export async function establishSessionFromAuthHash(
  supabase: SupabaseClient,
  hash: string
): Promise<SessionResult> {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return { ok: false, error: "missing_tokens" };
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function establishSessionFromAuthParams(
  supabase: SupabaseClient,
  searchParams: URLSearchParams
): Promise<SessionResult> {
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) return { ok: true };
    return { ok: false, error: error.message };
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return { ok: true };
    return { ok: false, error: error.message };
  }

  return { ok: false, error: "missing_params" };
}
