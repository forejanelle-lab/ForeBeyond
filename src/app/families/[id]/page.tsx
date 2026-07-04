import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FamilyProfileView } from "@/components/search/FamilyProfileView";
import { ListingAuthGate } from "@/components/listings/ListingAuthGate";
import { LISTING_IMAGE_FALLBACK } from "@/lib/listing-images";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import { createPageMetadata, privatePageMetadata } from "@/lib/site-metadata";
import { getListingCoverPhotoUrl } from "@/lib/seo-cover-photos";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildListingJsonLd } from "@/lib/json-ld";
import { formatAverageRating } from "@/lib/reviews";
import { getHostListingStats } from "@/lib/host-stats";
import { getHostReviewEligibility } from "@/lib/listing-review-eligibility";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import { hostHasMessagedStayRequest, isStayMessagingOpen } from "@/lib/messaging";
import { resolveListingForProfilePage } from "@/lib/listing-profile-load";
import type { DocumentType, HostListing, ListingPhoto, Profile, PublicListing, PublicReview, StayRequest, TrustBadge, VerificationStatus } from "@/types/database";
import { normalizeTrustScoreBreakdown, type TrustScoreBreakdown } from "@/lib/trust-score";
import { getRequestStayEligibility, documentsMapFromRows } from "@/lib/traveler-verification";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const data = await resolveListingForProfilePage(supabase, id);

  if (!data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: own } = await supabase
        .from("host_listings")
        .select("title, city, country, family_story")
        .eq("id", id)
        .eq("host_id", user.id)
        .single();
      if (own) {
        const title = own.title ?? `Family in ${own.city}`;
        const description =
          own.family_story?.slice(0, 155) ??
          `Stay with ${title} in ${own.city}, ${own.country}. Book an authentic cultural immersion with Fore Beyond.`;
        return createPageMetadata({
          title,
          description,
          path: `/families/${id}`,
          noIndex: true,
        });
      }
    }
    return createPageMetadata({
      title: "Family Not Found",
      description: "This host family listing could not be found on Fore Beyond.",
      path: `/families/${id}`,
      noIndex: true,
    });
  }

  const title = data.title ?? `Family in ${data.city}`;
  const description =
    data.family_story?.slice(0, 155) ??
    `Stay with ${title} in ${data.city}, ${data.country}. Book an authentic cultural immersion with Fore Beyond.`;
  const coverPhoto = await getListingCoverPhotoUrl(supabase, id);

  return privatePageMetadata({
    title,
    description,
    path: `/families/${id}`,
    ...(coverPhoto ? { image: coverPhoto } : {}),
  });
}

export default async function FamilyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, typedListing] = await Promise.all([
    supabase.auth.getUser(),
    resolveListingForProfilePage(supabase, id),
  ]);

  let hostListing: HostListing;
  let hostFirstName: string | null = null;
  let hostDisplayName: string | null = null;
  let hostAvatarUrl: string | null = null;
  let hostMemberSince: string | null = null;
  let hostMotivation: string | null = null;
  let trustScore = 0;
  let trustScoreBreakdown: TrustScoreBreakdown = {};
  let verificationStatus = "unverified";
  let isOwnListing = false;

  if (!typedListing) {
    if (!user) notFound();

    const { data: ownListing } = await supabase
      .from("host_listings")
      .select("*")
      .eq("id", id)
      .eq("host_id", user.id)
      .single();

    if (!ownListing) notFound();

    const own = ownListing as HostListing;
    isOwnListing = true;
    hostListing = own;

    const [{ data: hostProfile }, { data: hostProfileDetails }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, trust_score, trust_score_breakdown, verification_status, created_at, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("host_profiles")
        .select("host_motivation")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const profile = hostProfile as Pick<
      Profile,
      "full_name" | "trust_score" | "trust_score_breakdown" | "verification_status" | "created_at" | "avatar_url"
    > | null;
    hostMotivation =
      (hostProfileDetails as { host_motivation: string | null } | null)?.host_motivation ?? null;
    hostDisplayName = formatMemberDisplayName(profile?.full_name, {
      fallback: "Host",
    });
    hostAvatarUrl = profile?.avatar_url ?? null;
    hostFirstName = hostDisplayName;
    hostMemberSince = profile?.created_at ?? null;
    trustScore = profile?.trust_score ?? 0;
    trustScoreBreakdown = normalizeTrustScoreBreakdown(profile?.trust_score_breakdown);
    verificationStatus = profile?.verification_status ?? "unverified";
  } else {
    hostListing = {
      id: typedListing.id,
      host_id: typedListing.host_id,
      title: typedListing.title,
      family_story: typedListing.family_story,
      stay_details: typedListing.stay_details,
      intro_video_url: typedListing.intro_video_url,
      languages: typedListing.languages,
      country: typedListing.country,
      city: typedListing.city,
      meals: typedListing.meals,
      amenities: typedListing.amenities,
      family_activities: typedListing.family_activities,
      house_rules: typedListing.house_rules,
      budget_per_night: typedListing.budget_per_night,
      budget_per_night_3_guests: typedListing.budget_per_night_3_guests,
      budget_per_night_4_guests: typedListing.budget_per_night_4_guests,
      budget_per_night_5_guests: typedListing.budget_per_night_5_guests,
      budget_per_night_6_plus_guests: typedListing.budget_per_night_6_plus_guests,
      pricing_currency: typedListing.pricing_currency ?? "USD",
      max_capacity: typedListing.max_capacity,
      status: "published",
      published_at: typedListing.published_at,
      created_at: typedListing.created_at,
      updated_at: typedListing.created_at,
    };
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, created_at, avatar_url")
      .eq("id", typedListing.host_id)
      .single();

    const hostProfileData = hostProfile as Pick<
      Profile,
      "full_name" | "created_at" | "avatar_url"
    > | null;
    hostDisplayName = formatMemberDisplayName(
      hostProfileData?.full_name ?? typedListing.host_first_name,
      { fallback: "Host" }
    );
    hostAvatarUrl = hostProfileData?.avatar_url ?? null;
    hostFirstName = hostDisplayName;
    hostMemberSince = hostProfileData?.created_at ?? null;
    trustScore = typedListing.trust_score;
    trustScoreBreakdown = normalizeTrustScoreBreakdown(typedListing.trust_score_breakdown);
    verificationStatus = typedListing.verification_status;
    hostMotivation = typedListing.host_motivation;
    isOwnListing = user?.id === typedListing.host_id;
  }

  const hostId = hostListing.host_id;

  const [{ data: photos }, { data: badges }, { data: reviews }, { data: hostReviews }, savedResult] =
    await Promise.all([
      supabase
        .from("listing_photos")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order"),
      supabase
        .from("trust_badges")
        .select("*")
        .eq("user_id", hostId),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", hostId)
        .eq("reviewer_role", "traveler")
        .eq("listing_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("public_reviews")
        .select("rating, is_positive")
        .eq("reviewee_id", hostId)
        .eq("reviewer_role", "traveler"),
      user && !isOwnListing
        ? supabase
            .from("saved_listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("listing_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const hostStats = await getHostListingStats(supabase, hostId, id);
  const reviewEligibility = await getHostReviewEligibility(
    supabase,
    user?.id,
    hostId,
    id
  );

  let canMessageHost = false;
  let messageConversationId: string | null = null;
  let messageLockReason =
    "Send a stay request first. Messaging opens when the host contacts you or approves your stay.";

  if (user && !isOwnListing && user.id !== hostId) {
    const { data: stayRequest } = await supabase
      .from("stay_requests")
      .select("id, status, end_date")
      .eq("traveler_id", user.id)
      .eq("listing_id", id)
      .in("status", ["pending", "host_approved", "approved"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (stayRequest) {
      const typedRequest = stayRequest as Pick<StayRequest, "id" | "status" | "end_date">;
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("stay_request_id", typedRequest.id)
        .maybeSingle();

      messageConversationId = (conversation as { id: string } | null)?.id ?? null;

      const hostHasMessaged =
        typedRequest.status === "pending"
          ? await hostHasMessagedStayRequest(supabase, typedRequest.id, hostId)
          : false;

      canMessageHost = isStayMessagingOpen(typedRequest, {
        viewerIsHost: false,
        hostHasMessaged,
      });

      if (!canMessageHost) {
        messageLockReason =
          "Messaging opens when the host messages you first or approves your stay request.";
      }
    }
  }

  const hostReviewCount = (hostReviews as { rating: number }[] | null)?.length ?? 0;
  const hostAvgRating = formatAverageRating(
    (hostReviews as { rating: number }[] | null) ?? []
  );
  const listingReviewCount = (reviews as PublicReview[] | null)?.length ?? 0;

  let travelerCanRequestStay = false;
  let requestStayDisabledReason: string | undefined;
  if (user && !isOwnListing && user.id !== hostId) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const { data: verificationDocs } = await supabase
      .from("verification_documents")
      .select("document_type, status")
      .eq("user_id", user.id)
      .in("document_type", ["government_id", "selfie"]);

    const eligibility = getRequestStayEligibility(
      (viewerProfile as Pick<Profile, "role"> | null)?.role ?? null,
      documentsMapFromRows(
        verificationDocs as
          | { document_type: DocumentType; status: VerificationStatus }[]
          | null
      )
    );
    travelerCanRequestStay = eligibility.canRequest;
    requestStayDisabledReason = eligibility.disabledReason;
  }

  const showAuthGate = !user && Boolean(typedListing);

  const profileView = (
    <FamilyProfileView
      listing={hostListing}
      photos={(photos as ListingPhoto[]) ?? []}
      hostFirstName={hostFirstName}
      trustScore={trustScore}
      trustScoreBreakdown={trustScoreBreakdown}
      hostReviewCount={hostReviewCount}
      hostAvgRating={hostAvgRating}
      listingReviewCount={listingReviewCount}
      verificationStatus={verificationStatus}
      badges={(badges as TrustBadge[]) ?? []}
      reviews={(reviews as PublicReview[]) ?? []}
      isSaved={Boolean(savedResult.data)}
      userId={user?.id ?? null}
      showSaveButton={!isOwnListing}
      showBookingActions={!isOwnListing}
      canRequestStay={travelerCanRequestStay}
      requestStayDisabledReason={requestStayDisabledReason}
      bookingCount={hostStats.bookingCount}
      memberSince={hostMemberSince}
      avgResponseTimeMinutes={hostStats.avgResponseTimeMinutes}
      totalStayRequests={hostStats.totalRequests}
      respondedStayRequests={hostStats.respondedRequests}
      canLeaveReview={reviewEligibility.canReview}
      canEditReview={reviewEligibility.canEdit}
      reviewExisting={reviewEligibility.existingReview}
      reviewTarget={reviewEligibility.target}
      hostId={hostListing.host_id}
      canMessageHost={canMessageHost}
      messageConversationId={messageConversationId}
      messageLockReason={messageLockReason}
      hostMotivation={hostMotivation}
      hostAvatarUrl={hostAvatarUrl}
      hostDisplayName={hostDisplayName}
    />
  );

  return (
    <>
      {typedListing && (
        <JsonLd
          data={buildListingJsonLd({
            id,
            title: typedListing.title ?? `Family in ${typedListing.city}`,
            description:
              typedListing.family_story?.slice(0, 300) ??
              `Stay with a verified host family in ${typedListing.city}, ${typedListing.country}.`,
            city: typedListing.city,
            country: typedListing.country,
            image:
              (photos as ListingPhoto[] | null)?.find((photo) => photo.is_cover)?.file_url ??
              (photos as ListingPhoto[] | null)?.[0]?.file_url ??
              LISTING_IMAGE_FALLBACK,
            price: typedListing.budget_per_night,
            priceCurrency: typedListing.pricing_currency ?? "USD",
            ratingValue: hostAvgRating,
            reviewCount: hostReviewCount,
          })}
        />
      )}
      {isOwnListing && (
        <div className="bg-forest text-white text-sm text-center py-2.5 px-4">
          Previewing your listing as travelers see it.{" "}
          <Link href={`/host/listings/${id}/edit`} className="underline font-medium hover:no-underline">
            Edit listing
          </Link>
        </div>
      )}
      <TrackPageEvent
        event={AnalyticsEvents.FAMILY_PROFILE_VIEW}
        data={{
          listing_id: id,
          city: hostListing.city ?? "",
          country: hostListing.country ?? "",
        }}
      />
      {showAuthGate ? (
        <ListingAuthGate listingId={id}>{profileView}</ListingAuthGate>
      ) : (
        profileView
      )}
    </>
  );
}
