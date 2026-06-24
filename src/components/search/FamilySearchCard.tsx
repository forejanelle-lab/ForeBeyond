"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Shield, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatBudget } from "@/lib/search";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PublicListing } from "@/types/database";

interface FamilySearchCardProps {
  listing: PublicListing;
  coverPhotoUrl?: string | null;
  isSaved?: boolean;
  showSaveButton?: boolean;
}

export function FamilySearchCard({
  listing,
  coverPhotoUrl,
  isSaved = false,
  showSaveButton = true,
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

  return (
    <Link href={`/families/${listing.id}`} className="block group">
      <Card
        variant="outline"
        padding="sm"
        className="overflow-hidden h-full hover:shadow-md transition-shadow"
      >
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-sage mb-4">
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt={listing.title ?? "Family listing"}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-charcoal-light">
              No photo yet
            </div>
          )}

          {showSaveButton && (
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

          {listing.verification_status === "verified" && (
            <Badge variant="success" className="absolute top-2 left-2">
              <Shield className="h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-forest line-clamp-2 group-hover:text-forest-light transition-colors">
            {listing.title ?? "Family Home"}
          </h3>

          {(listing.city || listing.country) && (
            <p className="flex items-center gap-1 text-sm text-charcoal-light">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {[listing.city, listing.country].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              <Star className="h-3 w-3" />
              {listing.trust_score} Trust
            </Badge>
            <span className="text-sm font-medium text-forest">
              {formatBudget(listing.budget_per_night)}
            </span>
          </div>

          {listing.host_first_name && (
            <p className="text-xs text-charcoal-light">
              Hosted by {listing.host_first_name}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {listing.meals?.slice(0, 2).map((meal) => (
              <Badge key={meal} variant="outline" className="text-[10px]">
                {meal}
              </Badge>
            ))}
            {listing.family_activities?.slice(0, 1).map((activity) => (
              <Badge key={activity} variant="default" className="text-[10px]">
                {activity}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
