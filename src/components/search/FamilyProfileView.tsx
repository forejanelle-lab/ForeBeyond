import Image from "next/image";
import Link from "next/link";
import { MapPin, Globe, Utensils, Home, Sparkles, Shield, DollarSign } from "lucide-react";
import { ListingTrustPanel } from "@/components/listings/ListingTrustPanel";
import { SaveFamilyButton } from "@/components/search/SaveFamilyButton";
import { formatBudget } from "@/lib/search";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import type { HostListing, ListingPhoto, PublicListing, PublicReview, TrustBadge } from "@/types/database";

interface FamilyProfileViewProps {
  listing: HostListing | PublicListing;
  photos: ListingPhoto[];
  hostFirstName: string | null;
  trustScore: number;
  verificationStatus: string;
  badges: TrustBadge[];
  reviews: PublicReview[];
  isSaved?: boolean;
  showSaveButton?: boolean;
  userId?: string | null;
}

export function FamilyProfileView({
  listing,
  photos,
  hostFirstName,
  trustScore,
  verificationStatus,
  badges,
  reviews,
  isSaved = false,
  showSaveButton = true,
  userId = null,
}: FamilyProfileViewProps) {
  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0];
  const budget = "budget_per_night" in listing ? listing.budget_per_night : null;

  const tagSections = [
    { icon: Utensils, label: "Meals", items: listing.meals },
    { icon: Home, label: "Amenities", items: listing.amenities },
    { icon: Sparkles, label: "Family Activities", items: listing.family_activities },
    { icon: Shield, label: "House Rules", items: listing.house_rules },
  ];

  return (
    <>
      <Section background="cream" className="!py-0">
        <div className="relative h-64 md:h-[28rem] bg-sage">
          {coverPhoto && (
            <Image
              src={coverPhoto.file_url}
              alt={listing.title ?? "Family listing"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <Container className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {listing.title ?? "Family Home"}
                </h1>
                {(listing.city || listing.country) && (
                  <p className="flex items-center gap-1.5 text-white/85 mt-2">
                    <MapPin className="h-4 w-4" />
                    {[listing.city, listing.country].filter(Boolean).join(", ")}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-white/85 mt-2 text-sm md:text-base">
                  <DollarSign className="h-4 w-4" />
                  {formatBudget(budget)}
                </p>
              </div>
              {showSaveButton && (
                <div className="md:min-w-[220px]">
                  <SaveFamilyButton listingId={listing.id} initialSaved={isSaved} />
                </div>
              )}
            </div>
          </Container>
        </div>
      </Section>

      <Container className="py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          <div className="lg:col-span-2 space-y-8">
            {listing.family_story && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-3">Our Family Story</h2>
                <p className="text-charcoal-light leading-relaxed whitespace-pre-wrap">
                  {listing.family_story}
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

            {tagSections.map(
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

            {photos.length > 1 && (
              <section>
                <h2 className="text-xl font-semibold text-forest mb-4">Photos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sage">
                      <Image
                        src={photo.file_url}
                        alt={photo.caption ?? "Family photo"}
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div>
            <ListingTrustPanel
              hostFirstName={hostFirstName}
              trustScore={trustScore}
              verificationStatus={verificationStatus}
              badges={badges}
              reviews={reviews}
            />
            <Card variant="outline" padding="md" className="mt-6 text-center">
              <p className="text-sm text-charcoal-light mb-3">
                Interested in staying with this family?
              </p>
              {userId ? (
                <Link
                  href={`/families/${listing.id}/request`}
                  className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-light transition-colors w-full"
                >
                  Request Stay
                </Link>
              ) : (
                <Link
                  href={`/auth/sign-in?redirect=/families/${listing.id}/request`}
                  className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-light transition-colors w-full"
                >
                  Sign in to request stay
                </Link>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
