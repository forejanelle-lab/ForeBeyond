"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Shield, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBudget } from "@/lib/search";
import { ListingPreviewMedia } from "@/components/listings/ListingPreviewMedia";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PublicListing } from "@/types/database";

interface FamilySearchCardProps {
  listing: PublicListing;
  coverPhotoUrl?: string | null;
  hostDisplayName?: string | null;
  isSaved?: boolean;
  showSaveButton?: boolean;
  layout?: "grid" | "list";
}

export function FamilySearchCard({
  listing,
  coverPhotoUrl,
  hostDisplayName,
  isSaved = false,
  showSaveButton = true,
  layout = "grid",
}: FamilySearchCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(isSaved);
  const [isSaving, setIsSaving] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=/families/${listing.id}`);
      setIsSaving(false);
      return;
    }

    if (saved) {
      await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({
        user_id: user.id,
        listing_id: listing.id,
      });
      setSaved(true);
    }

    setIsSaving(false);
    router.refresh();
  }

  const imageBlock = (
    <div
      className={`relative shrink-0 overflow-hidden bg-sage ${
        layout === "list"
          ? "h-36 w-full rounded-xl sm:h-40 sm:w-44 md:h-44 md:w-52"
          : "mb-4 aspect-[16/10] w-full rounded-xl"
      }`}
    >
      <ListingPreviewMedia
        listing={listing}
        coverPhotoUrl={coverPhotoUrl}
        className={`object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
          layout === "list" ? "object-left" : "object-center"
        }`}
        sizes={layout === "list" ? "208px" : "(max-width: 768px) 100vw, 400px"}
      />
      {showSaveButton && layout === "grid" && (
        <button
          type="button"
          onClick={toggleSave}
          disabled={isSaving}
          aria-label={saved ? "Remove from saved families" : "Save family"}
          className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`h-4 w-4 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`}
          />
        </button>
      )}
      {listing.verification_status === "verified" && layout === "grid" && (
        <Badge variant="success" className="absolute top-2 left-2">
          <Shield className="h-3 w-3" />
          Verified
        </Badge>
      )}
    </div>
  );

  const contentBlock = (
    <div className={`space-y-2 ${layout === "list" ? "flex-1 py-1" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-forest line-clamp-2 group-hover:text-forest-light transition-colors">
          {listing.title ?? "Family Home"}
        </h3>
        {showSaveButton && layout === "list" && (
          <button
            type="button"
            onClick={toggleSave}
            disabled={isSaving}
            aria-label={saved ? "Remove from saved" : "Save family"}
            className="shrink-0 p-1"
          >
            <Heart
              className={`h-5 w-5 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`}
            />
          </button>
        )}
      </div>

      {(listing.city || listing.country) && (
        <p className="flex items-center gap-1 text-sm text-charcoal-light">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[listing.city, listing.country].filter(Boolean).join(", ")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">
          <Star className="h-3 w-3" />
          {listing.trust_score}
        </Badge>
        <span className="text-sm font-medium text-forest">
          {formatBudget(listing.budget_per_night)}
        </span>
        {listing.verification_status === "verified" && layout === "list" && (
          <Badge variant="success" className="text-[10px]">
            <Shield className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>

      {(hostDisplayName ?? listing.host_first_name) && (
        <p className="text-xs text-charcoal-light">
          Hosted by {hostDisplayName ?? listing.host_first_name}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {listing.meals?.slice(0, 2).map((meal) => (
          <Badge key={meal} variant="outline" className="text-[10px]">
            {meal}
          </Badge>
        ))}
        {listing.languages?.slice(0, 1).map((lang) => (
          <Badge key={lang} variant="default" className="text-[10px]">
            {lang}
          </Badge>
        ))}
      </div>
    </div>
  );

  return (
    <Link href={`/families/${listing.id}`} className="block group">
      <Card
        variant="outline"
        padding="sm"
        className={`overflow-hidden h-full hover:shadow-lg transition-shadow ${
          layout === "list" ? "!p-3" : ""
        }`}
      >
        {layout === "list" ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {imageBlock}
            {contentBlock}
          </div>
        ) : (
          <>
            {imageBlock}
            {contentBlock}
          </>
        )}
      </Card>
    </Link>
  );
}
