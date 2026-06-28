import Image from "next/image";
import Link from "next/link";
import { MapPin, DollarSign, MessageSquare, Lock, CalendarCheck, Clock } from "lucide-react";
import { FamilyProfileContent } from "@/components/search/FamilyProfileContent";
import { SaveFamilyButton } from "@/components/search/SaveFamilyButton";
import { ReportUserButton } from "@/components/reports/ReportUserButton";
import { TrustScorePanel } from "@/components/design/TrustScorePanel";
import { VerificationBadgeRow } from "@/components/design/VerificationBadgeRow";
import { formatBudget } from "@/lib/search";
import { formatAverageRating } from "@/lib/reviews";
import { formatAverageResponseTime, formatMemberSince } from "@/lib/host-stats";
import type { HostReviewExisting, HostReviewTarget } from "@/lib/listing-review-eligibility";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
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
  showBookingActions?: boolean;
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
}

export function FamilyProfileView({
  listing,
  photos,
  hostFirstName,
  trustScore,
  verificationStatus,
  reviews,
  isSaved = false,
  showSaveButton = true,
  showBookingActions = true,
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
}: FamilyProfileViewProps) {
  const coverPhoto = photos.find((p) => p.is_cover) ?? photos[0];
  const budget = "budget_per_night" in listing ? listing.budget_per_night : null;
  const isVerified = verificationStatus === "verified";
  const avgRating = formatAverageRating(reviews);

  return (
    <>
      <section className="relative h-64 md:h-[28rem] bg-sage">
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
            />
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
            <TrustScorePanel
              score={trustScore}
              reviewCount={reviews.length}
              avgRating={avgRating}
              showBreakdownLink
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
              {bookingCount === 0 && memberSince && (
                <p className="text-sm text-charcoal-light">
                  Member since {formatMemberSince(memberSince)}
                </p>
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
            </Card>

            <Card variant="outline" padding="md" className="space-y-4">
              {showBookingActions ? (
                <>
                  <p className="text-sm text-charcoal-light text-center">
                    Interested in staying with {hostFirstName ?? "this family"}?
                  </p>
                  {userId ? (
                    <>
                      <Link
                        href={`/families/${listing.id}/request`}
                        className="inline-flex items-center justify-center rounded-full bg-forest px-5 py-3 text-sm font-medium text-white hover:bg-forest-light transition-colors w-full"
                      >
                        Request to Stay
                      </Link>
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
