"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MapPin, Shield, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hostListingPath, hostListingSignInPath } from "@/lib/listing-access";
import { DisplayBudget } from "@/components/i18n/DisplayMoney";
import { HostAvatar } from "@/components/design/HostAvatar";
import { AutoTranslatableText, useAutoTranslation } from "@/components/i18n/AutoTranslatableText";
import { SearchCardPhotoGallery } from "@/components/search/SearchCardPhotoGallery";
import { ListingPreviewMedia } from "@/components/listings/ListingPreviewMedia";
import type { HostReviewStats } from "@/types/search-card";
import type { PublicListing } from "@/types/database";

interface FamilySearchCardProps {
  listing: PublicListing;
  listingPhotos?: string[];
  coverPhotoUrl?: string | null;
  hostDisplayName?: string | null;
  hostAvatarUrl?: string | null;
  hostReviewStats?: HostReviewStats | null;
  isSaved?: boolean;
  showSaveButton?: boolean;
  layout?: "grid" | "list";
}

function buildTags(listing: PublicListing, max = 3): string[] {
  const tags: string[] = [];
  if (listing.meals?.[0]) tags.push(listing.meals[0]);
  if (listing.languages?.length) {
    tags.push(
      listing.languages.length > 2
        ? `${listing.languages.slice(0, 2).join(" & ")}`
        : listing.languages.join(" & ")
    );
  }
  if (listing.family_activities?.[0] && tags.length < max) {
    tags.push(listing.family_activities[0]);
  }
  return tags.slice(0, max);
}

function excerptStory(story: string | null | undefined, max = 140) {
  if (!story?.trim()) return null;
  const trimmed = story.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

function formatListingLocation(city?: string | null, country?: string | null) {
  const location = [city, country].filter(Boolean).join(", ");
  return location || null;
}

export function FamilySearchCard({
  listing,
  listingPhotos = [],
  coverPhotoUrl,
  hostDisplayName,
  hostAvatarUrl,
  hostReviewStats = null,
  isSaved = false,
  showSaveButton = true,
  layout = "grid",
}: FamilySearchCardProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(isSaved);
  const [isSaving, setIsSaving] = useState(false);
  const listingHref = hostListingPath(listing.id);
  const listingLabel = listing.title ?? "Family Home";
  const isVerified = listing.verification_status === "verified";
  const hostName = hostDisplayName ?? listing.host_first_name;
  const resolvedAvatarUrl = hostAvatarUrl ?? listing.host_avatar_url ?? null;
  const tags = buildTags(listing);
  const translatedStory = useAutoTranslation(listing.family_story);
  const storyExcerpt = excerptStory(translatedStory);
  const locationLabel = formatListingLocation(listing.city, listing.country);
  const galleryPhotos =
    listingPhotos.length > 0
      ? listingPhotos
      : coverPhotoUrl
        ? [coverPhotoUrl]
        : [];

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(hostListingSignInPath(listing.id));
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

  const cardLink = (
    <Link
      href={listingHref}
      className="absolute inset-0 z-[1] rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
      aria-label={`View ${listingLabel}`}
    />
  );

  const saveButton = showSaveButton ? (
    <button
      type="button"
      onClick={toggleSave}
      disabled={isSaving}
      aria-label={saved ? "Remove from saved families" : "Save family"}
      className="absolute top-6 right-6 md:top-7 md:right-7 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm hover:bg-white transition-colors"
    >
      <Heart
        className={`h-4 w-4 ${saved ? "fill-forest text-forest" : "text-charcoal-light"}`}
      />
    </button>
  ) : null;

  if (layout === "list") {
    return (
      <article className="relative overflow-hidden rounded-[20px] border border-sage-dark/15 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md group">
        {cardLink}
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="md:w-[48%] lg:w-[46%] shrink-0 p-3 md:p-4 md:pr-2 relative">
            <SearchCardPhotoGallery
              photos={galleryPhotos}
              country={listing.country}
              city={listing.city}
              title={listing.title}
            />
            {saveButton}
          </div>

          <div className="flex flex-1 flex-col p-4 md:py-5 md:pr-5 md:pl-3 min-w-0">
            <div className="space-y-2">
              <AutoTranslatableText
                as="h3"
                text={listingLabel}
                className="font-serif text-xl md:text-2xl font-semibold text-forest leading-snug group-hover:text-forest-light transition-colors line-clamp-2"
              />

              {isVerified && (
                <p className="inline-flex items-center gap-1 rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest w-fit">
                  <Shield className="h-3 w-3 shrink-0" />
                  Verified Host
                </p>
              )}

              {locationLabel && (
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <AutoTranslatableText text={locationLabel} />
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-0.5">
                {hostReviewStats?.avgRating && hostReviewStats.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm text-charcoal">
                    <Star className="h-4 w-4 fill-gold text-gold shrink-0" />
                    <span className="font-medium">{hostReviewStats.avgRating}</span>
                    <span className="text-muted">
                      ({hostReviewStats.reviewCount}{" "}
                      {hostReviewStats.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-charcoal">
                    <Star className="h-4 w-4 fill-gold text-gold shrink-0" />
                    <span className="font-medium">{listing.trust_score}</span>
                    <span className="text-muted">Trust score</span>
                  </span>
                )}
                <span className="text-sm font-semibold text-forest">
                  <DisplayBudget nightlyRateUsd={listing.budget_per_night} listing={listing} />
                </span>
              </div>

              {storyExcerpt && (
                <p className="text-sm text-muted leading-relaxed line-clamp-2 pt-1">
                  <span aria-hidden="true">&ldquo;</span>
                  {storyExcerpt}
                  <span aria-hidden="true">&rdquo;</span>
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-sage/90 px-2.5 py-0.5 text-xs font-medium text-forest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {hostName && (
              <div className="relative z-[2] mt-auto pt-4 flex items-center gap-2.5">
                <HostAvatar
                  avatarUrl={resolvedAvatarUrl}
                  firstName={listing.host_first_name}
                  hostName={hostName}
                  sizeClass="h-10 w-10"
                  expandable={false}
                />
                <p className="text-sm text-charcoal-light">
                  Hosted by{" "}
                  <AutoTranslatableText
                    text={hostName}
                    className="font-medium text-charcoal"
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-[20px] border border-sage-dark/15 bg-white shadow-sm h-full flex flex-col transition-shadow duration-300 hover:shadow-md group">
      {cardLink}
      <div className="relative aspect-[16/10] overflow-hidden bg-sage">
        <ListingPreviewMedia
          listing={listing}
          coverPhotoUrl={galleryPhotos[0] ?? coverPhotoUrl}
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        {saveButton}
        {isVerified && (
          <span className="absolute top-3 left-3 z-[2] inline-flex items-center gap-1 rounded-full bg-sage/95 px-2.5 py-0.5 text-xs font-medium text-forest">
            <Shield className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 space-y-2">
        <AutoTranslatableText
          as="h3"
          text={listingLabel}
          className="font-serif text-xl font-semibold text-forest line-clamp-2 group-hover:text-forest-light transition-colors"
        />

        {locationLabel && (
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <AutoTranslatableText text={locationLabel} />
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {hostReviewStats?.avgRating && hostReviewStats.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="font-medium">{hostReviewStats.avgRating}</span>
              <span className="text-muted text-xs">({hostReviewStats.reviewCount})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              <span className="font-medium">{listing.trust_score}</span>
            </span>
          )}
          <span className="text-sm font-semibold text-forest">
            <DisplayBudget nightlyRateUsd={listing.budget_per_night} listing={listing} />
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-sage/90 px-2 py-0.5 text-[11px] font-medium text-forest"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {hostName && (
          <div className="flex items-center gap-2 pt-1 mt-auto">
            <HostAvatar
              avatarUrl={resolvedAvatarUrl}
              firstName={listing.host_first_name}
              hostName={hostName}
              sizeClass="h-8 w-8"
              expandable={false}
            />
            <p className="text-xs text-muted">
              Hosted by <AutoTranslatableText text={hostName} />
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
