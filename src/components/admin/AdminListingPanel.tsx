"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { HostListing, ListingStatus } from "@/types/database";

interface AdminListingPanelProps {
  listings: (HostListing & { host_name: string | null })[];
}

const STATUS_VARIANT: Record<ListingStatus, "outline" | "success" | "default"> = {
  draft: "outline",
  published: "success",
  archived: "default",
};

export function AdminListingPanel({ listings: initial }: AdminListingPanelProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(listingId: string, status: ListingStatus) {
    setLoadingId(listingId);
    const supabase = createClient();
    await supabase
      .from("host_listings")
      .update({
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", listingId);

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status } : l))
    );
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => (
        <div
          key={listing.id}
          className="rounded-xl border border-sage-dark/30 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
        >
          <div>
            <Link
              href={`/families/${listing.id}`}
              target="_blank"
              className="font-medium text-forest hover:underline inline-flex items-center gap-1.5"
            >
              {listing.title ?? "Untitled listing"}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <p className="text-xs text-charcoal-light">
              {listing.host_name ?? "Host"} · {[listing.city, listing.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_VARIANT[listing.status]}>{listing.status}</Badge>
            {listing.status !== "published" && (
              <Button
                variant="primary"
                size="sm"
                disabled={loadingId === listing.id}
                onClick={() => updateStatus(listing.id, "published")}
              >
                Publish
              </Button>
            )}
            {listing.status !== "archived" && (
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === listing.id}
                onClick={() => updateStatus(listing.id, "archived")}
              >
                Archive
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
