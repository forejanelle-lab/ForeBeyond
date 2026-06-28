"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe, Utensils, Home, Sparkles, Shield } from "lucide-react";
import { ProfileTabs } from "@/components/design/ProfileTabs";
import { ListingReviewAction } from "@/components/reviews/ListingReviewAction";
import { ReviewList } from "@/components/reviews/ReviewList";
import type { HostReviewExisting, HostReviewTarget } from "@/lib/listing-review-eligibility";
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
}: FamilyProfileContentProps) {
  const [activeTab, setActiveTab] = useState("about");

  const tagSections = [
    { icon: Utensils, label: "Meals", items: listing.meals },
    { icon: Home, label: "Amenities", items: listing.amenities },
    { icon: Sparkles, label: "Family Activities", items: listing.family_activities },
    { icon: Shield, label: "House Rules", items: listing.house_rules },
  ];

  return (
    <div className="space-y-8">
      <ProfileTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "about" && (
        <div className="space-y-8 pt-4">
          {listing.family_story && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Our Family Story</h2>
              <p className="text-charcoal-light leading-relaxed whitespace-pre-wrap">
                {listing.family_story}
              </p>
            </section>
          )}
          {listing.stay_details && (
            <section>
              <h2 className="text-xl font-semibold text-forest mb-3">Details</h2>
              <p className="text-charcoal-light leading-relaxed whitespace-pre-wrap">
                {listing.stay_details}
              </p>
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
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sage">
                  <Image
                    src={photo.file_url}
                    alt={photo.caption ?? "Family photo"}
                    fill
                    unoptimized={photo.file_url.startsWith("http")}
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
            <p className="text-charcoal-light">No photos uploaded yet.</p>
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
