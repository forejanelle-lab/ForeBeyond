"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

interface ShareListingButtonProps {
  listingId: string;
  title?: string | null;
}

export function ShareListingButton({ listingId, title }: ShareListingButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/families/${listingId}`
        : `/families/${listingId}`;
    const shareData = {
      title: title ?? "Fore Beyond host family",
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* fall through to copy */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-sage-dark/40 bg-white px-4 py-2 text-sm font-medium text-charcoal hover:bg-sage/30 transition-colors"
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
