import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HostContactDetailsCard } from "@/components/listings/HostContactDetailsCard";
import { TripCompleteButton } from "@/components/reviews/TripCompleteButton";
import { TripReviewSection } from "@/components/reviews/TripReviewSection";
import { isTripPastEndDate } from "@/lib/reviews";
import { formatMessagingDisplayName } from "@/lib/messaging";
import { TripBookingSummary } from "@/components/trips/TripBookingSummary";
import {
  PAYMENT_STATUS_LABELS,
  TRIP_STATUS_LABELS,
  formatDateRange,
} from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { ListingContactDetails, Profile, PublicListing, Review, StayBooking, StayRequest, Trip } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Trip Details",
  description: "Trip details, dates, and stay information on Fore Beyond.",
  path: "/trips",
});

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

  const [{ data: listing }, { data: otherProfile }, { data: booking }, { data: stayRequest }, { data: conversation }, { data: tripReviews }, { data: userReview }, { data: listingContact }] =
    await Promise.all([
      typedTrip.listing_id
        ? supabase.from("public_listings").select("title, city, country, pricing_currency").eq("id", typedTrip.listing_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("profiles").select("full_name, email").eq("id", otherUserId).single(),
      supabase.from("stay_bookings").select("*").eq("trip_id", id).maybeSingle(),
      typedTrip.stay_request_id
        ? supabase.from("stay_requests").select("id, status, end_date").eq("id", typedTrip.stay_request_id).single()
        : Promise.resolve({ data: null }),
      typedTrip.stay_request_id
        ? supabase.from("conversations").select("id").eq("stay_request_id", typedTrip.stay_request_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("reviews").select("*").eq("trip_id", id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("trip_id", id).eq("reviewer_id", user.id).maybeSingle(),
      typedTrip.listing_id
        ? supabase
            .from("listing_contact_details")
            .select("contact_email, contact_address")
            .eq("listing_id", typedTrip.listing_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const listingData = listing as Pick<PublicListing, "title" | "city" | "country" | "pricing_currency"> | null;
  const bookingData = booking as StayBooking | null;
  const requestData = stayRequest as Pick<StayRequest, "id" | "status" | "end_date"> | null;

  const otherFullName = formatMessagingDisplayName(
    (otherProfile as Pick<Profile, "full_name"> | null)?.full_name,
    isTraveler ? "Host" : "Guest",
    { stayStatus: requestData?.status ?? "approved" }
  );
  const otherName = otherFullName;
  const hostEmail =
    (otherProfile as Pick<Profile, "email"> | null)?.email ?? null;
  const contactData = listingContact as Pick<ListingContactDetails, "contact_email" | "contact_address"> | null;
  const conversationId = (conversation as { id: string } | null)?.id ?? null;
  const tripStatus = TRIP_STATUS_LABELS[typedTrip.status] ?? TRIP_STATUS_LABELS.upcoming;
  const showHostContact =
    isTraveler &&
    (requestData?.status === "approved" || requestData?.status === "completed");
  const hostContactForTraveler =
    showHostContact && (contactData?.contact_email || contactData?.contact_address)
      ? contactData
      : showHostContact && hostEmail
        ? { contact_email: hostEmail, contact_address: null }
        : null;
  const canCompleteTrip =
    typedTrip.status !== "completed" && isTripPastEndDate(typedTrip.end_date);

  return (
    <Container className="py-10 md:py-16">
      <Link href="/trips" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        All trips
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Badge variant={tripStatus.variant}>{tripStatus.label}</Badge>
        {bookingData?.stripe_payment_intent_id && (
          <Badge variant="success">Service fee paid</Badge>
        )}
        {bookingData?.payment_status === "paid" && (
          <Badge variant={PAYMENT_STATUS_LABELS.paid.variant}>
            {PAYMENT_STATUS_LABELS.paid.label}
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
          <Card variant="outline" padding="md" className="space-y-3">
            <h2 className="font-semibold text-forest">Trip details</h2>
            <p className="text-sm text-charcoal-light">{formatDateRange(typedTrip.start_date, typedTrip.end_date)}</p>
            {bookingData && (
              <TripBookingSummary
                totalAmount={bookingData.total_amount}
                serviceFeePaid={Boolean(bookingData.stripe_payment_intent_id)}
                hostCountry={listingData?.country}
                pricingCurrency={listingData?.pricing_currency}
              />
            )}
          </Card>

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
            otherName={otherFullName}
            tripReviews={(tripReviews as Review[]) ?? []}
            userReview={(userReview as Review | null) ?? null}
          />
        </div>

        <div className="space-y-4">
          {conversationId && (
            <ButtonLink href={`/messages/${conversationId}`} variant="secondary" size="md" className="w-full">
              <MessageSquare className="h-4 w-4" />
              Message {otherName}
            </ButtonLink>
          )}

          <Card variant="outline" padding="md">
            <h3 className="font-semibold text-forest mb-2">Booking reference</h3>
            <p className="text-xs font-mono text-charcoal-light break-all">
              {(typedTrip.stay_request_id ?? bookingData?.id ?? typedTrip.id).slice(0, 8).toUpperCase()}
            </p>
          </Card>

          {hostContactForTraveler && (
            <HostContactDetailsCard contact={hostContactForTraveler} />
          )}
        </div>
      </div>
    </Container>
  );
}
