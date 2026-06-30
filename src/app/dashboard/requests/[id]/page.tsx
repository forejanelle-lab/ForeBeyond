import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TravelerConfirmStay } from "@/components/stays/TravelerConfirmStay";
import { TravelerModifyStayDates } from "@/components/stays/TravelerModifyStayDates";
import { ApprovedStayLinks } from "@/components/stays/HostRequestActions";
import { HostContactDetailsCard } from "@/components/listings/HostContactDetailsCard";
import { StayRequestStatusBadge } from "@/components/stays/StayRequestStatusBadge";
import { canTravelerModifyStayDates } from "@/lib/stay-request-dates";
import { getStayBlockedDates } from "@/lib/stay-availability";
import { formatMessagingDisplayName } from "@/lib/messaging";
import { formatDateRange, LISTING_PRICING_SELECT, pickListingPricing, type ListingPricing } from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { ListingContactDetails, PublicListing, StayBooking, StayRequest } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Stay Request",
  description: "View your stay request status on Fore Beyond.",
  path: "/dashboard/requests",
});

export default async function TravelerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/dashboard/requests/${id}`);

  const { data: request } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("id", id)
    .eq("traveler_id", user.id)
    .single();

  if (!request) notFound();

  const typedRequest = request as StayRequest;

  const [{ data: listing }, { data: host }, { data: booking }, { data: listingContact }] = await Promise.all([
    typedRequest.listing_id
      ? supabase.from("public_listings").select(`title, city, country, ${LISTING_PRICING_SELECT}`).eq("id", typedRequest.listing_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("full_name").eq("id", typedRequest.host_id).single(),
    supabase.from("stay_bookings").select("trip_id").eq("stay_request_id", id).maybeSingle(),
    typedRequest.listing_id
      ? supabase
          .from("listing_contact_details")
          .select("contact_email, contact_address")
          .eq("listing_id", typedRequest.listing_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let listingData = listing as (Pick<PublicListing, "title" | "city" | "country"> & ListingPricing) | null;

  if (!listingData && typedRequest.listing_id) {
    const { data: requestListing } = await supabase
      .from("host_listings")
      .select(`title, city, country, ${LISTING_PRICING_SELECT}`)
      .eq("id", typedRequest.listing_id)
      .maybeSingle();

    listingData = requestListing as (Pick<PublicListing, "title" | "city" | "country"> & ListingPricing) | null;
  }

  const hostDisplayName = formatMessagingDisplayName(
    (host as { full_name: string | null } | null)?.full_name,
    "Host",
    { stayStatus: typedRequest.status }
  );
  const tripId = (booking as Pick<StayBooking, "trip_id"> | null)?.trip_id ?? null;
  const listingPricing = pickListingPricing(listingData ?? {});
  const contactData = listingContact as Pick<ListingContactDetails, "contact_email" | "contact_address"> | null;
  const showHostContact =
    typedRequest.status === "approved" || typedRequest.status === "completed";
  const blockedDateRanges = typedRequest.listing_id
    ? await getStayBlockedDates(supabase, typedRequest.listing_id, typedRequest.id)
    : [];

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link href="/trips" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        My trips
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <StayRequestStatusBadge status={typedRequest.status} />
        <Badge variant="outline">Booking ref: {typedRequest.id.slice(0, 8).toUpperCase()}</Badge>
      </div>

      <h1 className="text-3xl font-bold text-forest mb-2">
        {listingData?.title ?? "Stay request"}
      </h1>
      <p className="text-charcoal-light mb-2">Host: {hostDisplayName}</p>
      {typedRequest.listing_id && (
        <Link
          href={`/families/${typedRequest.listing_id}`}
          className="text-sm font-medium text-forest hover:underline mb-8 inline-block"
        >
          View family listing →
        </Link>
      )}
      {!typedRequest.listing_id && <div className="mb-8" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outline" padding="md" className="space-y-3">
            <h2 className="font-semibold text-forest">Stay details</h2>
            <p className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-forest" />
              {formatDateRange(typedRequest.start_date, typedRequest.end_date)}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-forest" />
              {typedRequest.guest_count} guest{typedRequest.guest_count !== 1 ? "s" : ""}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          {canTravelerModifyStayDates(typedRequest.status) && (
            <TravelerModifyStayDates
              request={typedRequest}
              blockedDateRanges={blockedDateRanges}
            />
          )}
          {typedRequest.status === "host_approved" && (
            <TravelerConfirmStay
              request={typedRequest}
              listingPricing={listingPricing}
              hostName={hostDisplayName}
            />
          )}
          {typedRequest.status === "approved" && (
            <>
              {showHostContact && contactData && (
                <HostContactDetailsCard contact={contactData} />
              )}
              <ApprovedStayLinks tripId={tripId} />
            </>
          )}
          {typedRequest.status === "pending" && (
            <Card variant="outline" padding="md">
              <p className="text-sm text-charcoal-light">
                Waiting for {hostDisplayName} to review your request. Once they approve, you&apos;ll confirm
                the final stay and service fee.
              </p>
            </Card>
          )}
          {typedRequest.status === "rejected" && (
            <Card variant="outline" padding="md">
              <p className="text-sm text-charcoal-light">
                This request was declined. Browse other families to find your match.
              </p>
              <Link href="/search" className="inline-block mt-3 text-sm font-medium text-forest hover:underline">
                Search families
              </Link>
            </Card>
          )}
          {typedRequest.status === "cancelled" && typedRequest.withdrawal_reason && (
            <Card variant="outline" padding="md" className="border-amber-200 bg-amber-50/50">
              <h2 className="font-semibold text-forest mb-2">Stay withdrawn by host</h2>
              <p className="text-sm text-charcoal-light whitespace-pre-wrap">
                {typedRequest.withdrawal_reason}
              </p>
              <Link href="/search" className="inline-block mt-3 text-sm font-medium text-forest hover:underline">
                Search other families
              </Link>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
