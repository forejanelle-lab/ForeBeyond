"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  Instagram,
  Link2,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { InstagramConnectionStatus } from "@/lib/social-media/types";

interface InstagramConnectionCardProps {
  status: InstagramConnectionStatus;
  metaAppReady: boolean;
  oauthRedirectUris?: string[];
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

function CopyUriButton({ uri }: { uri: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-forest shadow-sm hover:bg-sage/30"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function InstagramConnectionCard({
  status,
  metaAppReady,
  oauthRedirectUris = [],
  instagramAppId,
  flashMessage,
  flashError,
}: InstagramConnectionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(flashError ?? "");
  const [setupOpen, setSetupOpen] = useState(!status.connected);

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
    <div className="overflow-hidden rounded-2xl border border-sage-dark/15 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <Instagram className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-white">Instagram publishing</h2>
              <p className="text-sm text-white/85">
                Connect once to auto-publish approved posts, or use manual download below.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {status.connected ? (
              <>
                <Badge variant="success" className="border-0 bg-white/95 text-forest">
                  <ShieldCheck className="h-3 w-3" />
                  Connected
                </Badge>
                {status.source === "oauth" && (
                  <Button
                    variant="white"
                    size="sm"
                    onClick={handleDisconnect}
                    isLoading={loading}
                    disabled={loading}
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                )}
              </>
            ) : metaAppReady ? (
              <Button
                variant="white"
                size="sm"
                onClick={() => {
                  window.location.href = "/api/admin/social-media/connect";
                }}
              >
                <Link2 className="h-4 w-4" />
                Connect Instagram
              </Button>
            ) : (
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs text-white">
                App credentials not configured
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {status.connected ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-sage-dark/10 bg-sage/10 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-light">
                Account
              </p>
              <p className="mt-1 font-medium text-forest">
                {status.username ? `@${status.username}` : status.accountName ?? "Instagram Business"}
              </p>
            </div>
            {status.pageName && (
              <div className="rounded-xl border border-sage-dark/10 bg-sage/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-light">
                  Facebook Page
                </p>
                <p className="mt-1 font-medium text-forest">{status.pageName}</p>
              </div>
            )}
            {status.connectedAt && (
              <div className="rounded-xl border border-sage-dark/10 bg-sage/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-light">
                  Connected
                </p>
                <p className="mt-1 font-medium text-forest">{formatDate(status.connectedAt)}</p>
              </div>
            )}
            {status.expiresAt && (
              <div className="rounded-xl border border-sage-dark/10 bg-sage/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal-light">
                  Token expires
                </p>
                <p className="mt-1 font-medium text-forest">{formatDate(status.expiresAt)}</p>
              </div>
            )}
            {status.source === "env" && (
              <div className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 sm:col-span-2">
                <p className="text-sm text-forest">
                  Publishing via server environment variables (legacy mode).
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-charcoal-light">
            Sign in with your Instagram Business or Creator account to publish approved posts
            automatically. You can always download images and copy captions manually from each post card.
          </p>
        )}

        {!status.connected && (oauthRedirectUris.length > 0 || instagramAppId) && (
          <div className="rounded-xl border border-sage-dark/15 bg-sage/10">
            <button
              type="button"
              onClick={() => setSetupOpen((open) => !open)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-forest"
            >
              Meta app setup help
              <ChevronDown
                className={`h-4 w-4 transition-transform ${setupOpen ? "rotate-180" : ""}`}
              />
            </button>
            {setupOpen && (
              <div className="space-y-3 border-t border-sage-dark/10 px-4 pb-4 pt-3 text-sm text-charcoal-light">
                {oauthRedirectUris.length > 0 && (
                  <div>
                    <p className="font-medium text-forest">
                      Add these OAuth redirect URIs in Meta → ForeBeyond-IG → Instagram → Business login
                    </p>
                    <p className="mt-1 text-xs">
                      The first URI is what Connect uses — it must match Meta exactly.
                    </p>
                    <ul className="mt-3 space-y-2">
                      {oauthRedirectUris.map((uri, index) => (
                        <li
                          key={uri}
                          className="flex flex-col gap-2 rounded-xl border border-white/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            {index === 0 && (
                              <span className="mb-1 inline-block rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forest">
                                Active
                              </span>
                            )}
                            <p className="break-all font-mono text-xs text-forest">{uri}</p>
                          </div>
                          <CopyUriButton uri={uri} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {instagramAppId && (
                  <p className="text-xs">
                    Instagram App ID:{" "}
                    <span className="font-mono text-forest">{instagramAppId}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {flashMessage && (
          <div className="rounded-xl border border-green-200/80 bg-green-50 px-4 py-3 text-sm text-green-800">
            {flashMessage}
          </div>
        )}

        {(error || flashError) && (
          <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error || flashError}
          </div>
        )}
      </div>
    </div>
  );
}
