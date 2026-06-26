import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HostRequestActions } from "@/components/stays/HostRequestActions";
import { HostIncomeBreakdown } from "@/components/stays/HostIncomeBreakdown";
import { HostStayMessageButton } from "@/components/stays/HostStayMessageButton";
import {
  ensureStayConversation,
  isStayMessagingOpen,
} from "@/lib/messaging";
import { StayRequestStatusBadge } from "@/components/stays/StayRequestStatusBadge";
import { ReviewList } from "@/components/reviews/ReviewList";
import {
  formatBookingReference,
  formatDateRange,
  LISTING_PRICING_SELECT,
  pickListingPricing,
  type ListingPricing,
} from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { Profile, HostListing, PublicReview, StayRequest } from "@/types/database";

export const metadata = { title: "Review Request" };

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

  const [{ data: listing }, { data: traveler }, { data: travelerReviews }] =
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
        .select("full_name, bio, location")
        .eq("id", typedRequest.traveler_id)
        .single(),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", typedRequest.traveler_id)
        .eq("reviewer_role", "host")
        .order("created_at", { ascending: false }),
    ]);

  let conversationId: string | null = null;
  if (isStayMessagingOpen(typedRequest)) {
    conversationId = await ensureStayConversation(supabase, id);
  }
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
  } | null;
  const travelerFullName = travelerProfile?.full_name?.trim() || "Traveler";
  const listingData = listing as (Pick<HostListing, "title"> & ListingPricing) | null;
  const listingPricing = pickListingPricing(listingData ?? {});
  const reviews = (travelerReviews as PublicReview[]) ?? [];

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link href="/host/requests" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        Pending requests
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <StayRequestStatusBadge status={typedRequest.status} />
        <Badge variant="outline">Booking ref: {formatBookingReference(typedRequest.id)}</Badge>
      </div>

      <h1 className="text-3xl font-bold text-forest">{travelerFullName}</h1>
      <p className="text-charcoal-light mt-2">
        {listingData?.title ?? "Stay request"}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outline" padding="md">
            <h2 className="font-semibold text-forest mb-3">Traveler introduction</h2>
            <p className="text-charcoal-light whitespace-pre-wrap">{typedRequest.message}</p>
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
        </div>

        <div className="space-y-4">
          <HostRequestActions request={typedRequest} listingPricing={listingPricing} />
          <HostStayMessageButton
            request={typedRequest}
            conversationId={conversationId}
            guestName={travelerFullName}
          />
        </div>
      </div>
    </Container>
  );
}
