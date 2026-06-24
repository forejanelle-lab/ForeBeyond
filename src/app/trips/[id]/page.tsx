import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StayMessagingPanel } from "@/components/stays/StayMessagingPanel";
import { TripCompleteButton } from "@/components/reviews/TripCompleteButton";
import { TripReviewSection } from "@/components/reviews/TripReviewSection";
import { isTripPastEndDate } from "@/lib/reviews";
import {
  PAYMENT_STATUS_LABELS,
  TRIP_STATUS_LABELS,
  formatCurrency,
  formatDateRange,
} from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { Profile, PublicListing, Review, StayBooking, StayRequest, Trip } from "@/types/database";

export const metadata = { title: "Trip Details" };

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/trips/${id}`);

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .single();

  if (!trip) notFound();

  const typedTrip = trip as Trip;
  const isTraveler = typedTrip.traveler_id === user.id;
  const otherUserId = isTraveler ? typedTrip.host_id : typedTrip.traveler_id;

  const [{ data: listing }, { data: otherProfile }, { data: booking }, { data: stayRequest }, { data: conversation }, { data: tripReviews }, { data: userReview }] =
    await Promise.all([
      typedTrip.listing_id
        ? supabase.from("public_listings").select("title, city, country").eq("id", typedTrip.listing_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("profiles").select("full_name").eq("id", otherUserId).single(),
      supabase.from("stay_bookings").select("*").eq("trip_id", id).maybeSingle(),
      typedTrip.stay_request_id
        ? supabase.from("stay_requests").select("id, status").eq("id", typedTrip.stay_request_id).single()
        : Promise.resolve({ data: null }),
      typedTrip.stay_request_id
        ? supabase.from("conversations").select("id").eq("stay_request_id", typedTrip.stay_request_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("reviews").select("*").eq("trip_id", id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("trip_id", id).eq("reviewer_id", user.id).maybeSingle(),
    ]);

  const otherName =
    (otherProfile as Pick<Profile, "full_name"> | null)?.full_name?.split(" ")[0] ?? "Guest";
  const listingData = listing as Pick<PublicListing, "title" | "city" | "country"> | null;
  const bookingData = booking as StayBooking | null;
  const requestData = stayRequest as Pick<StayRequest, "id" | "status"> | null;
  const tripStatus = TRIP_STATUS_LABELS[typedTrip.status] ?? TRIP_STATUS_LABELS.upcoming;
  const messagingUnlocked = requestData?.status === "approved" || requestData?.status === "completed";
  const canCompleteTrip =
    typedTrip.status !== "completed" &&
    bookingData?.payment_status === "paid" &&
    isTripPastEndDate(typedTrip.end_date);

  return (
    <Container className="py-10 md:py-16">
      <Link href="/trips" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        All trips
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Badge variant={tripStatus.variant}>{tripStatus.label}</Badge>
        {bookingData && (
          <Badge variant={PAYMENT_STATUS_LABELS[bookingData.payment_status].variant}>
            {PAYMENT_STATUS_LABELS[bookingData.payment_status].label}
          </Badge>
        )}
      </div>

      <h1 className="text-3xl font-bold text-forest mb-2">
        {listingData?.title ?? "Your trip"}
      </h1>
      <p className="text-charcoal-light mb-8">
        with {otherName}
        {listingData && (listingData.city || listingData.country)
          ? ` · ${[listingData.city, listingData.country].filter(Boolean).join(", ")}`
          : ""}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outline" padding="md">
            <h2 className="font-semibold text-forest mb-3">Trip details</h2>
            <p className="text-sm text-charcoal-light">{formatDateRange(typedTrip.start_date, typedTrip.end_date)}</p>
            {bookingData && (
              <p className="text-sm font-medium text-forest mt-2">
                Total: {formatCurrency(bookingData.total_amount)}
                {bookingData.nightly_rate != null && ` (${formatCurrency(bookingData.nightly_rate)}/night)`}
              </p>
            )}
          </Card>

          {requestData && conversation && (
            <div className="space-y-3">
              <StayMessagingPanel
                conversationId={(conversation as { id: string }).id}
                stayRequestId={requestData.id}
                userId={user.id}
                otherPartyName={otherName}
                unlocked={messagingUnlocked}
              />
              <Link
                href={`/messages/${(conversation as { id: string }).id}`}
                className="text-sm font-medium text-forest hover:underline"
              >
                Open full conversation
              </Link>
            </div>
          )}

          <TripCompleteButton
            tripId={id}
            userId={user.id}
            canComplete={canCompleteTrip}
          />

          <TripReviewSection
            tripId={id}
            userId={user.id}
            travelerId={typedTrip.traveler_id}
            hostId={typedTrip.host_id}
            tripStatus={typedTrip.status}
            otherName={otherName}
            tripReviews={(tripReviews as Review[]) ?? []}
            userReview={(userReview as Review | null) ?? null}
          />
        </div>

        <div className="space-y-4">
          {isTraveler && bookingData?.payment_status === "pending" && (
            <Card variant="outline" padding="md" className="space-y-3">
              <h3 className="font-semibold text-forest">Complete your booking</h3>
              <p className="text-sm text-charcoal-light">
                Secure your stay with a payment to confirm your trip.
              </p>
              <Link href={`/trips/${id}/payment`}>
                <Button variant="primary" size="md" className="w-full">
                  <CreditCard className="h-4 w-4" />
                  Go to payment
                </Button>
              </Link>
            </Card>
          )}

          <Card variant="outline" padding="md">
            <h3 className="font-semibold text-forest mb-2">Booking reference</h3>
            <p className="text-xs font-mono text-charcoal-light break-all">{bookingData?.id ?? typedTrip.id}</p>
          </Card>
        </div>
      </div>
    </Container>
  );
}
