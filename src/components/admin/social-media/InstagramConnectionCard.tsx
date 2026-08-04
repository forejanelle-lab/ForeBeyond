"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instagram, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { InstagramConnectionStatus } from "@/lib/social-media/types";

interface InstagramConnectionCardProps {
  status: InstagramConnectionStatus;
  metaAppReady: boolean;
  oauthRedirectUri?: string | null;
  instagramAppId?: string | null;
  flashMessage?: string | null;
  flashError?: string | null;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InstagramConnectionCard({
  status,
  metaAppReady,
  oauthRedirectUri,
  instagramAppId,
  flashMessage,
  flashError,
}: InstagramConnectionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(flashError ?? "");

  async function handleDisconnect() {
    if (!confirm("Disconnect Instagram from Fore Beyond admin? Scheduled publishing will stop.")) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/social-media/disconnect", { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Disconnect failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-sage/60 bg-white/80 px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white">
            <Instagram className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-forest">Instagram Account</h2>
            {status.connected ? (
              <div className="mt-1 space-y-0.5 text-sm text-forest/80">
                <p>
                  Connected as{" "}
                  <span className="font-medium text-forest">
                    {status.username ? `@${status.username}` : status.accountName ?? "Instagram Business"}
                  </span>
                  {status.source === "env" && (
                    <span className="ml-2 rounded bg-sage/40 px-1.5 py-0.5 text-xs">env vars</span>
                  )}
                </p>
                {status.pageName && <p>Facebook Page: {status.pageName}</p>}
                {status.connectedAt && <p>Connected {formatDate(status.connectedAt)}</p>}
                {status.expiresAt && <p>Token expires {formatDate(status.expiresAt)}</p>}
              </div>
            ) : (
              <div className="mt-1 space-y-1 text-sm text-forest/70">
                <p>
                  Sign in with your Instagram Business or Creator account to publish approved posts
                  automatically.
                </p>
                {oauthRedirectUri && (
                  <p className="text-xs text-forest/60">
                    Meta redirect URI must include:{" "}
                    <code className="break-all rounded bg-sage/30 px-1">{oauthRedirectUri}</code>
                  </p>
                )}
                {instagramAppId && (
                  <p className="text-xs text-forest/60">
                    Use the <strong>Instagram App ID</strong> from Meta (not Facebook App ID):{" "}
                    <code>{instagramAppId}</code>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {status.connected && status.source === "oauth" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              isLoading={loading}
              disabled={loading}
            >
              <Unlink className="mr-1.5 h-4 w-4" />
              Disconnect
            </Button>
          ) : !status.connected ? (
            metaAppReady ? (
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  window.location.href = "/api/admin/social-media/connect";
                }}
              >
                <Link2 className="mr-1.5 h-4 w-4" />
                Connect Instagram
              </Button>
            ) : (
              <p className="max-w-xs text-xs text-forest/60">
                Set <code>INSTAGRAM_APP_ID</code> and <code>INSTAGRAM_APP_SECRET</code> to enable
                Connect.
              </p>
            )
          ) : null}
        </div>
      </div>

      {flashMessage && (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {flashMessage}
        </p>
      )}

      {(error || flashError) && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error || flashError}
        </p>
      )}
    </div>
  );
}
