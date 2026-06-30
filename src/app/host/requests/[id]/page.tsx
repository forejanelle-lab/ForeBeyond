import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HostRequestActions } from "@/components/stays/HostRequestActions";
import { HostIncomeBreakdown } from "@/components/stays/HostIncomeBreakdown";
import { GuestRequestMedia } from "@/components/stays/GuestRequestMedia";
import { HostStayMessageButton } from "@/components/stays/HostStayMessageButton";
import { TripCompleteButton } from "@/components/reviews/TripCompleteButton";
import { TripReviewSection } from "@/components/reviews/TripReviewSection";
import { isTripPastEndDate } from "@/lib/reviews";
import {
  ensureStayConversation,
} from "@/lib/messaging";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import { guestProfilePath } from "@/lib/host-guest-access";
import { StayRequestStatusBadge } from "@/components/stays/StayRequestStatusBadge";
import { ReviewList } from "@/components/reviews/ReviewList";
import { TravelerOnboardingDetails } from "@/components/profile/TravelerOnboardingDetails";
import {
  formatBookingReference,
  formatDateRange,
  LISTING_PRICING_SELECT,
  parseStayRequestMessage,
  pickListingPricing,
  type ListingPricing,
} from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { Profile, HostListing, PublicReview, Review, StayRequest, StayRequestPhoto, TravelerProfile, Trip } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Review Request",
  description: "Review a traveler stay request on Fore Beyond.",
  path: "/host/requests",
});

export default async function HostRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/host/requests/${id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as Pick<Profile, "role"> | null)?.role !== "host") {
    redirect("/profile/complete");
  }

  const { data: request } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!request) notFound();

  const typedRequest = request as StayRequest;

  const [{ data: listing }, { data: traveler }, { data: travelerReviews }, { data: requestPhotos }, { data: trip }, { data: travelerOnboarding }] =
    await Promise.all([
      typedRequest.listing_id
        ? supabase
            .from("host_listings")
            .select(`title, ${LISTING_PRICING_SELECT}`)
            .eq("id", typedRequest.listing_id)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("full_name, bio, location, avatar_url, trust_score, verification_status")
        .eq("id", typedRequest.traveler_id)
        .single(),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", typedRequest.traveler_id)
        .eq("reviewer_role", "host")
        .order("created_at", { ascending: false }),
      supabase
        .from("stay_request_photos")
        .select("*")
        .eq("stay_request_id", id)
        .order("sort_order", { ascending: true }),
      supabase.from("trips").select("*").eq("stay_request_id", id).maybeSingle(),
      supabase
        .from("traveler_profiles")
        .select("interests, travel_style, dietary_preferences, accessibility_needs, stay_motivation")
        .eq("user_id", typedRequest.traveler_id)
        .maybeSingle(),
    ]);

  const typedTrip = trip as Trip | null;
  const [{ data: tripReviews }, { data: hostTripReview }] = typedTrip
    ? await Promise.all([
        supabase
          .from("reviews")
          .select("*")
          .eq("trip_id", typedTrip.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("*")
          .eq("trip_id", typedTrip.id)
          .eq("reviewer_id", user.id)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  let conversationId = await ensureStayConversation(supabase, id);
  if (!conversationId) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("stay_request_id", id)
      .maybeSingle();
    conversationId = (conversation as { id: string } | null)?.id ?? null;
  }

  const travelerProfile = traveler as {
    full_name: string | null;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    trust_score: number | null;
    verification_status: string | null;
  } | null;
  const guestProfileHref = guestProfilePath(typedRequest.traveler_id, typedRequest.id);
  const travelerDisplayName = formatMemberDisplayName(travelerProfile?.full_name, {
    fallback: "Traveler",
    stayStatus: typedRequest.status,
  });
  const { intro: travelerIntro, motivation: stayMotivation } = parseStayRequestMessage(
    typedRequest.message
  );
  const listingData = listing as (Pick<HostListing, "title"> & ListingPricing) | null;
  const listingPricing = pickListingPricing(listingData ?? {});
  const reviews = (travelerReviews as PublicReview[]) ?? [];
  const guestPhotos = (requestPhotos as StayRequestPhoto[]) ?? [];
  const onboardingForHost =
    (travelerOnboarding as Pick<
      TravelerProfile,
      "interests" | "travel_style" | "dietary_preferences" | "accessibility_needs" | "stay_motivation"
    > | null) ?? null;
  const canCompleteTrip =
    typedTrip != null &&
    typedTrip.status !== "completed" &&
    isTripPastEndDate(typedTrip.end_date);

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link href="/host/requests" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Requests
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StayRequestStatusBadge status={typedRequest.status} />
        <Badge variant="outline">Booking ref: {formatBookingReference(typedRequest.id)}</Badge>
      </div>

      <h1 className="text-3xl font-bold text-forest">
        <Link href={guestProfileHref} className="hover:underline">
          {travelerDisplayName}
        </Link>
      </h1>
      <p className="text-charcoal-light mt-2">
        {listingData?.title ?? "Stay request"}
        {" · "}
        <Link href={guestProfileHref} className="text-forest hover:underline">
          View trust profile
          {travelerProfile?.trust_score != null ? ` (${travelerProfile.trust_score})` : ""}
        </Link>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <GuestRequestMedia
            guestName={travelerDisplayName}
            guestUserId={typedRequest.traveler_id}
            guestProfileHref={guestProfileHref}
            avatarUrl={travelerProfile?.avatar_url ?? null}
            message={typedRequest.message}
            photos={guestPhotos}
          />

          <Card variant="outline" padding="md">
            <h2 className="font-semibold text-forest mb-3">Traveler introduction</h2>
            <p className="text-charcoal-light whitespace-pre-wrap">
              {travelerIntro || "No introduction provided."}
            </p>
            {stayMotivation && (
              <div className="mt-4 pt-4 border-t border-sage-dark/30">
                <p className="text-sm font-medium text-forest mb-1">
                  What they&apos;re hoping for
                </p>
                <p className="text-sm text-charcoal-light whitespace-pre-wrap">{stayMotivation}</p>
              </div>
            )}
            {travelerProfile?.bio && (
              <p className="text-sm text-charcoal-light mt-4 pt-4 border-t border-sage-dark/30">
                <strong className="text-forest">Bio:</strong> {travelerProfile.bio}
              </p>
            )}
            {travelerProfile?.location && (
              <p className="text-sm text-charcoal-light mt-2">
                <strong className="text-forest">From:</strong> {travelerProfile.location}
              </p>
            )}
          </Card>

          <TravelerOnboardingDetails
            profile={onboardingForHost}
            title="Guest preferences from onboarding"
          />

          <Card variant="outline" padding="md" className="space-y-3">
            <p className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-forest" />
              {formatDateRange(typedRequest.start_date, typedRequest.end_date)}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-forest" />
              {typedRequest.guest_count} guest{typedRequest.guest_count !== 1 ? "s" : ""}
            </p>
            <HostIncomeBreakdown request={typedRequest} pricing={listingPricing} />
          </Card>

          <ReviewList
            title="Reviews from other hosts"
            reviews={reviews}
            showReviewerName
            emptyMessage="This guest has no reviews from other host families yet."
          />

          {typedTrip && (
            <>
              <TripCompleteButton
                tripId={typedTrip.id}
                userId={user.id}
                canComplete={canCompleteTrip}
              />
              <TripReviewSection
                tripId={typedTrip.id}
                userId={user.id}
                travelerId={typedTrip.traveler_id}
                hostId={typedTrip.host_id}
                tripStatus={typedTrip.status}
                otherName={travelerDisplayName}
                tripReviews={(tripReviews as Review[]) ?? []}
                userReview={(hostTripReview as Review | null) ?? null}
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <HostRequestActions
            request={typedRequest}
            listingPricing={listingPricing}
            guestName={travelerDisplayName}
          />
          <HostStayMessageButton
            request={typedRequest}
            conversationId={conversationId}
            guestName={travelerDisplayName}
          />
        </div>
      </div>
    </Container>
  );
}
