import Link from "next/link";
import { ArrowLeft, MapPin, MessageSquare, Lock, CalendarCheck, Clock, Users, Star, Shield } from "lucide-react";
import { FamilyProfileContent } from "@/components/search/FamilyProfileContent";
import { RequestStayButton } from "@/components/stays/RequestStayButton";
import { SaveFamilyButton } from "@/components/search/SaveFamilyButton";
import { ReportUserButton } from "@/components/reports/ReportUserButton";
import { TrustScorePanel } from "@/components/design/TrustScorePanel";
import { VerificationBadgeRow } from "@/components/design/VerificationBadgeRow";
import { ListingPhotoGallery } from "@/components/listings/ListingPhotoGallery";
import { ShareListingButton } from "@/components/listings/ShareListingButton";
import { HostAvatar } from "@/components/design/HostAvatar";
import { AutoTranslatableText } from "@/components/i18n/AutoTranslatableText";
import { formatAverageResponseTime, formatMemberSince } from "@/lib/host-stats";
import { DisplayStayRateFromPricing } from "@/components/i18n/DisplayMoney";
import { pickListingPricing } from "@/lib/stay-requests";
import { formatListingMaxCapacityLabel } from "@/lib/listings";
import {
  formatPreferredGuestGender,
  parsePreferredGuestGender,
} from "@/lib/household";
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
  requestStayDisabledReason?: string;
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
  requestStayDisabledReason,
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
  const listingPricing = pickListingPricing(listing);
  const isVerified = verificationStatus === "verified";
  const hostNameForDisplay = hostDisplayName ?? hostFirstName;
  const preferredGuestGender = parsePreferredGuestGender(listing.preferred_guest_gender);
  const resolvedAvatarUrl =
    hostAvatarUrl ??
    ("host_avatar_url" in listing ? listing.host_avatar_url : null) ??
    null;

  const responseRate =
    totalStayRequests > 0
      ? Math.round((respondedStayRequests / totalStayRequests) * 100)
      : null;

  return (
    <Container className="py-6 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal hover:text-forest transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
        <div className="flex items-center gap-2">
          <ShareListingButton listingId={listing.id} title={listing.title} />
          {showSaveButton && (
            <SaveFamilyButton listingId={listing.id} initialSaved={isSaved} variant="icon" />
          )}
        </div>
      </div>

      <ListingPhotoGallery
        photos={photos}
        country={listing.country}
        city={listing.city}
        title={listing.title}
      />

      <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <AutoTranslatableText
              as="h1"
              text={listing.title ?? "Family Home"}
              className="text-3xl md:text-4xl lg:text-[2.5rem] font-serif font-semibold text-forest leading-tight text-balance"
            />

            {isVerified && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest">
                <Shield className="h-4 w-4" />
                Verified Host
              </p>
            )}

            {(listing.city || listing.country) && (
              <p className="flex items-center gap-1.5 text-muted mt-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <AutoTranslatableText
                  text={[listing.city, listing.country].filter(Boolean).join(", ")}
                />
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              {hostAvgRating && (
                <span className="inline-flex items-center gap-1 text-charcoal">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <span className="font-medium">{hostAvgRating}</span>
                  {hostReviewCount > 0 && (
                    <span className="text-muted">({hostReviewCount} reviews)</span>
                  )}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-forest font-medium">
                Trust score {trustScore}/100
              </span>
            </div>

            <div className="mt-4">
              <VerificationBadgeRow verified={isVerified} />
            </div>
          </div>

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

        <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
          <Card variant="outline" padding="md" className="space-y-4 shadow-md">
            <div>
              <p className="text-2xl font-serif font-semibold text-forest">
                <DisplayStayRateFromPricing
                  pricing={listingPricing}
                  guestCount={1}
                  country={listing.country}
                />
              </p>
            </div>

            {listing.max_capacity != null && listing.max_capacity > 0 && (
              <p className="text-sm text-muted flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-forest" />
                Hosts up to {formatListingMaxCapacityLabel(listing.max_capacity)}
              </p>
            )}
            <p className="text-sm text-muted">
              Prefers to host {formatPreferredGuestGender(preferredGuestGender).toLowerCase()}
            </p>

            {showBookingActions ? (
              <>
                {userId ? (
                  <>
                    <RequestStayButton
                      listingId={listing.id}
                      enabled={canRequestStay}
                      disabledReason={requestStayDisabledReason}
                    />
                    {canMessageHost && messageConversationId ? (
                      <Link
                        href={`/messages/${messageConversationId}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/20 bg-white px-5 py-3 text-sm font-medium text-forest hover:bg-sage/40 transition-colors w-full"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Message Family
                      </Link>
                    ) : (
                      <span
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-dark/40 bg-sage/20 px-5 py-3 text-sm font-medium text-muted w-full cursor-not-allowed"
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
                    className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-3.5 text-sm font-medium text-white hover:bg-forest-light transition-colors w-full"
                  >
                    Request to stay
                  </Link>
                )}

                <p className="text-xs text-muted text-center">
                  You won&apos;t be charged yet.
                </p>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                  <Lock className="h-3.5 w-3.5" />
                  Host contact details shared once your stay is confirmed
                </p>
              </>
            ) : (
              <p className="text-sm text-muted text-center">
                This is your listing preview. Travelers will see request and message options here.
              </p>
            )}
          </Card>

          <TrustScorePanel
            score={trustScore}
            reviewCount={hostReviewCount}
            avgRating={hostAvgRating}
            listingReviewCount={listingReviewCount}
            listingId={listing.id}
            hostName={hostNameForDisplay}
            breakdown={trustScoreBreakdown}
          />

          <Card variant="outline" padding="md" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-forest">Host reliability</h3>
              {hostId && userId && userId !== hostId && (
                <ReportUserButton
                  reportedUserId={hostId}
                  reportedListingId={listing.id}
                  label="Report"
                />
              )}
            </div>

            {hostNameForDisplay && (
              <div className="flex items-center gap-3">
                <HostAvatar
                  avatarUrl={resolvedAvatarUrl}
                  firstName={hostFirstName}
                  hostName={hostNameForDisplay}
                  sizeClass="h-12 w-12"
                />
                <div>
                  <AutoTranslatableText
                    as="p"
                    text={hostNameForDisplay}
                    className="text-sm font-medium text-charcoal"
                  />
                  <p className="text-xs text-muted">Your host</p>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              {responseRate != null && (
                <div className="flex items-center justify-between gap-3 py-2 border-b border-sage-dark/20">
                  <span className="text-muted">Response rate</span>
                  <span className="font-medium text-forest">{responseRate}%</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-sage-dark/20">
                <span className="text-muted inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Avg. response time
                </span>
                <span className="font-medium text-forest">
                  {formatAverageResponseTime(
                    avgResponseTimeMinutes,
                    totalStayRequests,
                    respondedStayRequests
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-2">
                <span className="text-muted inline-flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Completed stays
                </span>
                <span className="font-medium text-forest">{bookingCount}</span>
              </div>
            </div>

            {memberSince && (
              <p className="text-xs text-muted pt-1">
                Member since {formatMemberSince(memberSince)}
              </p>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
}
