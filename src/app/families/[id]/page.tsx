import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FamilyProfileView } from "@/components/search/FamilyProfileView";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import { getHostListingStats } from "@/lib/host-stats";
import { getHostReviewEligibility } from "@/lib/listing-review-eligibility";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import { hostHasMessagedStayRequest, isStayMessagingOpen } from "@/lib/messaging";
import type { HostListing, ListingPhoto, Profile, PublicListing, PublicReview, StayRequest, TrustBadge } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_listings")
    .select("title, city, country")
    .eq("id", id)
    .single();

  if (!data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: own } = await supabase
        .from("host_listings")
        .select("title, city, country")
        .eq("id", id)
        .eq("host_id", user.id)
        .single();
      if (own) return { title: own.title ?? `Family in ${own.city}` };
    }
    return { title: "Family Not Found" };
  }
  return { title: data.title ?? `Family in ${data.city}` };
}

export default async function FamilyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase.from("public_listings").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  const typedListing = listing as PublicListing | null;
  let hostListing: HostListing;
  let hostFirstName: string | null = null;
  let hostMemberSince: string | null = null;
  let trustScore = 0;
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

    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, trust_score, verification_status, created_at")
      .eq("id", user.id)
      .single();

    const profile = hostProfile as Pick<
      Profile,
      "full_name" | "trust_score" | "verification_status" | "created_at"
    > | null;
    hostFirstName = formatMemberDisplayName(profile?.full_name, {
      fallback: "Host",
      revealFullName: true,
    });
    hostMemberSince = profile?.created_at ?? null;
    trustScore = profile?.trust_score ?? 0;
    verificationStatus = profile?.verification_status ?? "unverified";
  } else {
    hostListing = {
      id: typedListing.id,
      host_id: typedListing.host_id,
      title: typedListing.title,
      family_story: typedListing.family_story,
      stay_details: typedListing.stay_details,
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
      max_capacity: typedListing.max_capacity,
      status: "published",
      published_at: typedListing.published_at,
      created_at: typedListing.created_at,
      updated_at: typedListing.created_at,
    };
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, created_at")
      .eq("id", typedListing.host_id)
      .single();

    hostFirstName = formatMemberDisplayName(
      (hostProfile as Pick<Profile, "full_name" | "created_at"> | null)?.full_name ??
        typedListing.host_first_name,
      { fallback: "Host" }
    );
    hostMemberSince =
      (hostProfile as Pick<Profile, "full_name" | "created_at"> | null)?.created_at ?? null;
    trustScore = typedListing.trust_score;
    verificationStatus = typedListing.verification_status;
    isOwnListing = user?.id === typedListing.host_id;
  }

  const hostId = hostListing.host_id;

  const [{ data: photos }, { data: badges }, { data: reviews }, savedResult] =
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

  return (
    <>
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
      <FamilyProfileView
        listing={hostListing}
        photos={(photos as ListingPhoto[]) ?? []}
        hostFirstName={hostFirstName}
        trustScore={trustScore}
        verificationStatus={verificationStatus}
        badges={(badges as TrustBadge[]) ?? []}
        reviews={(reviews as PublicReview[]) ?? []}
        isSaved={Boolean(savedResult.data)}
        userId={user?.id ?? null}
        showSaveButton={!isOwnListing}
        showBookingActions={!isOwnListing}
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
      />
    </>
  );
}
