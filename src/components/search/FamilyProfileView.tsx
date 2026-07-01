import Link from "next/link";
import Image from "next/image";
import { MapPin, DollarSign, MessageSquare, Lock, CalendarCheck, Clock, User } from "lucide-react";
import { FamilyProfileContent } from "@/components/search/FamilyProfileContent";
import { RequestStayButton } from "@/components/stays/RequestStayButton";
import { SaveFamilyButton } from "@/components/search/SaveFamilyButton";
import { ReportUserButton } from "@/components/reports/ReportUserButton";
import { TrustScorePanel } from "@/components/design/TrustScorePanel";
import { VerificationBadgeRow } from "@/components/design/VerificationBadgeRow";
import { ListingImage } from "@/components/listings/ListingImage";
import { formatAverageResponseTime, formatMemberSince } from "@/lib/host-stats";
import { formatStayRateLabel, pickListingPricing } from "@/lib/stay-requests";
import type { HostReviewExisting, HostReviewTarget } from "@/lib/listing-review-eligibility";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import type { HostListing, ListingPhoto, PublicListing, PublicReview, TrustBadge } from "@/types/database";
import type { TrustScoreBreakdown } from "@/lib/trust-score";

interface FamilyProfileViewProps {
  listing: HostListing | PublicListing;
  photos: ListingPhoto[];
  hostFirstName: string | null;
  trustScore: number;
  trustScoreBreakdown?: TrustScoreBreakdown | null;
  hostReviewCount?: number;
  hostAvgRating?: string | null;
  listingReviewCount?: number;
  verificationStatus: string;
  badges: TrustBadge[];
  reviews: PublicReview[];
  isSaved?: boolean;
  showSaveButton?: boolean;
  showBookingActions?: boolean;
  canRequestStay?: boolean;
  userId?: string | null;
  bookingCount?: number;
  memberSince?: string | null;
  avgResponseTimeMinutes?: number | null;
  totalStayRequests?: number;
  respondedStayRequests?: number;
  canLeaveReview?: boolean;
  canEditReview?: boolean;
  reviewExisting?: HostReviewExisting | null;
  reviewTarget?: HostReviewTarget | null;
  hostId?: string;
  canMessageHost?: boolean;
  messageConversationId?: string | null;
  messageLockReason?: string;
  hostMotivation?: string | null;
  hostAvatarUrl?: string | null;
  hostDisplayName?: string | null;
}

export function FamilyProfileView({
  listing,
  photos,
  hostFirstName,
  trustScore,
  trustScoreBreakdown = null,
  hostReviewCount = 0,
  hostAvgRating = null,
  listingReviewCount = 0,
  verificationStatus,
  reviews,
  isSaved = false,
  showSaveButton = true,
  showBookingActions = true,
  canRequestStay = false,
  userId = null,
  bookingCount = 0,
  memberSince = null,
  avgResponseTimeMinutes = null,
  totalStayRequests = 0,
  respondedStayRequests = 0,
  canLeaveReview = false,
  canEditReview = false,
  reviewExisting = null,
  reviewTarget = null,
  hostId,
  canMessageHost = false,
  messageConversationId = null,
  messageLockReason = "Messaging opens when the host messages you first or approves your stay request.",
  hostMotivation = null,
  hostAvatarUrl = null,
  hostDisplayName = null,
}: FamilyProfileViewProps) {
  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0];
  const listingPricing = pickListingPricing(listing);
  const nightlyRateLabel = formatStayRateLabel(listingPricing, 1);
  const isVerified = verificationStatus === "verified";
  const hostNameForDisplay = hostDisplayName ?? hostFirstName;
  const hostInitials = hostNameForDisplay
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <section className="relative h-64 md:h-[28rem] bg-sage">
        <ListingImage
          src={coverPhoto?.file_url}
          country={listing.country}
          city={listing.city}
          alt={listing.title ?? "Family listing"}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Container className="absolute bottom-0 left-0 right-0 pb-6 md:pb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gold mb-2 uppercase tracking-wide">
                Fore Beyond Family
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-white">
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
                {nightlyRateLabel}
              </p>
            </div>
            {showSaveButton && (
              <div className="md:min-w-[220px]">
                <SaveFamilyButton listingId={listing.id} initialSaved={isSaved} />
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="mb-8">
          <VerificationBadgeRow verified={isVerified} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2">
            <FamilyProfileContent
              listing={listing}
              photos={photos}
              reviews={reviews}
              reviewUserId={showBookingActions ? userId : null}
              canLeaveReview={canLeaveReview}
              canEditReview={canEditReview}
              reviewExisting={reviewExisting}
              reviewTarget={reviewTarget}
              hostName={hostFirstName}
              hostMotivation={hostMotivation}
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <TrustScorePanel
              score={trustScore}
              reviewCount={hostReviewCount}
              avgRating={hostAvgRating}
              listingReviewCount={listingReviewCount}
              listingId={listing.id}
              hostName={hostNameForDisplay}
              breakdown={trustScoreBreakdown}
            />

            <Card variant="outline" padding="md" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-forest">Host reliability</h3>
                {hostId && userId && userId !== hostId && (
                  <ReportUserButton
                    reportedUserId={hostId}
                    reportedListingId={listing.id}
                    label="Report host"
                  />
                )}
              </div>
              {hostNameForDisplay && (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-sage-dark/40 bg-sage">
                    {hostAvatarUrl ? (
                      <Image
                        src={hostAvatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized
                      />
                    ) : hostInitials ? (
                      <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-forest">
                        {hostInitials}
                      </span>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-forest">
                        <User className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-forest">{hostNameForDisplay}</p>
                    <p className="text-xs text-charcoal-light">Your host</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-sage/40 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs text-charcoal-light mb-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    Avg. response time
                  </p>
                  <p className="font-semibold text-forest">
                    {formatAverageResponseTime(
                      avgResponseTimeMinutes,
                      totalStayRequests,
                      respondedStayRequests
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-sage/40 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-xs text-charcoal-light mb-0.5">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Bookings
                  </p>
                  <p className="font-semibold text-forest">{bookingCount}</p>
                </div>
              </div>
              {memberSince && (
                <p className="text-sm text-charcoal-light">
                  Member since {formatMemberSince(memberSince)}
                </p>
              )}
            </Card>

            <Card variant="outline" padding="md" className="space-y-4">
              {showBookingActions ? (
                <>
                  <p className="text-sm text-charcoal-light text-center">
                    Interested in staying with {hostFirstName ?? "this family"}?
                  </p>
                  {userId ? (
                    <>
                      <RequestStayButton
                        listingId={listing.id}
                        enabled={canRequestStay}
                      />
                      {canMessageHost && messageConversationId ? (
                        <Link
                          href={`/messages/${messageConversationId}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/30 bg-white px-5 py-3 text-sm font-medium text-forest hover:bg-sage/40 transition-colors w-full"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message Family
                        </Link>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-dark/50 bg-sage/20 px-5 py-3 text-sm font-medium text-charcoal-light w-full cursor-not-allowed"
                          title={messageLockReason}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message Family
                        </span>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/auth/sign-in?redirect=/families/${listing.id}/request`}
                      className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-white hover:bg-forest-light transition-colors w-full"
                    >
                      Sign in to request stay
                    </Link>
                  )}
                  <p className="flex items-center justify-center gap-1.5 text-xs text-charcoal-light">
                    <Lock className="h-3.5 w-3.5" />
                    Host contact details are shared once your stay is confirmed
                  </p>
                </>
              ) : (
                <p className="text-sm text-charcoal-light text-center">
                  This is your listing preview. Travelers will see request and message options here.
                </p>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
