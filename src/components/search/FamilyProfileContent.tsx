"use client";

import { useState } from "react";
import { Globe, Utensils, Home, Sparkles, Shield } from "lucide-react";
import { HostIntroVideo } from "@/components/listings/HostIntroVideo";
import { ListingImage } from "@/components/listings/ListingImage";
import { isListingLogoFallbackUrl } from "@/lib/listing-images";
import { ProfileTabs } from "@/components/design/ProfileTabs";
import { ListingReviewAction } from "@/components/reviews/ListingReviewAction";
import { ReviewList } from "@/components/reviews/ReviewList";
import type { HostReviewExisting, HostReviewTarget } from "@/lib/listing-review-eligibility";
import { AutoTranslatableText } from "@/components/i18n/AutoTranslatableText";
import { Badge } from "@/components/ui/Badge";
import type { HostListing, ListingPhoto, PublicListing, PublicReview } from "@/types/database";

interface FamilyProfileContentProps {
  listing: HostListing | PublicListing;
  photos: ListingPhoto[];
  reviews: PublicReview[];
  reviewUserId?: string | null;
  canLeaveReview?: boolean;
  canEditReview?: boolean;
  reviewExisting?: HostReviewExisting | null;
  reviewTarget?: HostReviewTarget | null;
  hostName?: string | null;
  hostMotivation?: string | null;
}

const tabs = [
  { id: "about", label: "About" },
  { id: "photos", label: "Photos" },
  { id: "life", label: "Life at Home" },
  { id: "experiences", label: "Experiences" },
  { id: "amenities", label: "Amenities" },
  { id: "reviews", label: "Reviews" },
];

export function FamilyProfileContent({
  listing,
  photos,
  reviews,
  reviewUserId = null,
  canLeaveReview = false,
  canEditReview = false,
  reviewExisting = null,
  reviewTarget = null,
  hostName = null,
  hostMotivation = null,
}: FamilyProfileContentProps) {
  const [activeTab, setActiveTab] = useState("about");
  const introVideoUrl = "intro_video_url" in listing ? listing.intro_video_url : null;
  const motivation =
    hostMotivation ??
    ("host_motivation" in listing ? listing.host_motivation : null);

  const tagSections = [
    { icon: Utensils, label: "Meals", items: listing.meals },
    { icon: Home, label: "Amenities", items: listing.amenities },
    { icon: Sparkles, label: "Family Activities", items: listing.family_activities },
    { icon: Shield, label: "House Rules", items: listing.house_rules },
  ];

  const uploadedPhotos = photos.filter((photo) => !isListingLogoFallbackUrl(photo.file_url));

  return (
    <div className="space-y-8">
      <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "about" && (
        <div className="space-y-8 pt-4">
          {introVideoUrl && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Meet Your Host</h2>
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <HostIntroVideo
                  src={introVideoUrl}
                  variant="player"
                  listingId={listing.id}
                  className="h-full w-full object-contain"
                  ariaLabel={
                    hostName
                      ? `Introduction video from ${hostName}`
                      : "Host introduction video"
                  }
                />
              </div>
              {hostName && (
                <p className="text-sm text-charcoal-light mt-2">
                  A personal introduction from {hostName}
                </p>
              )}
            </section>
          )}
          {listing.family_story && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Our Family Story</h2>
              <AutoTranslatableText
                as="p"
                text={listing.family_story}
                className="text-charcoal-light leading-relaxed"
              />
            </section>
          )}
          {motivation && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Why We Host</h2>
              <AutoTranslatableText
                as="p"
                text={motivation}
                className="text-charcoal-light leading-relaxed"
              />
            </section>
          )}
          {listing.stay_details && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Details</h2>
              <AutoTranslatableText
                as="p"
                text={listing.stay_details}
                className="text-charcoal-light leading-relaxed"
              />
            </section>
          )}
          {listing.languages && listing.languages.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                <Globe className="h-5 w-5" /> Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.languages.map((lang) => (
                  <Badge key={lang} variant="default">{lang}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "photos" && (
        <div className="pt-4">
          {uploadedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sage">
                  <ListingImage
                    src={photo.file_url}
                    country={listing.country}
                    city={listing.city}
                    alt={photo.caption ?? "Family photo"}
                    fill
                    showLogoFallback={false}
                    className="object-cover"
                    sizes="300px"
                  />
                  {photo.caption && (
                    <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal-light">No photos yet.</p>
          )}
        </div>
      )}

      {activeTab === "life" && (
        <div className="space-y-8 pt-4">
          {tagSections
            .filter((s) => s.label !== "Amenities")
            .map(
              (section) =>
                section.items &&
                section.items.length > 0 && (
                  <section key={section.label}>
                    <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                      <section.icon className="h-5 w-5" /> {section.label}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <Badge key={item} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </section>
                )
            )}
        </div>
      )}

      {activeTab === "experiences" && (
        <div className="space-y-6 pt-4">
          {listing.family_activities && listing.family_activities.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> Cultural Experiences
              </h2>
              <p className="text-charcoal-light mb-4">
                Activities and experiences this family offers during your stay.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listing.family_activities.map((activity) => (
                  <div
                    key={activity}
                    className="card-premium rounded-2xl p-5 bg-white border border-sage-dark/20"
                  >
                    <Sparkles className="h-5 w-5 text-gold mb-2" />
                    <p className="font-medium text-forest">{activity}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-charcoal-light">No experiences listed yet.</p>
          )}
        </div>
      )}

      {activeTab === "amenities" && (
        <div className="space-y-8 pt-4">
          {listing.amenities && listing.amenities.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                <Home className="h-5 w-5" /> Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((item) => (
                  <Badge key={item} variant="outline">{item}</Badge>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-charcoal-light">No amenities listed yet.</p>
          )}
          {listing.house_rules && listing.house_rules.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" /> House Rules
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.house_rules.map((item) => (
                  <Badge key={item} variant="outline">{item}</Badge>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="pt-4 space-y-6">
          {reviewUserId && (
            <ListingReviewAction
              canReview={canLeaveReview}
              canEdit={canEditReview}
              target={reviewTarget}
              existingReview={reviewExisting}
              userId={reviewUserId}
              hostName={hostName ?? "your host"}
            />
          )}
          <ReviewList
            title="Traveler Reviews"
            reviews={reviews}
            emptyMessage="No reviews yet. Be the first to stay with this family."
          />
        </div>
      )}
    </div>
  );
}
