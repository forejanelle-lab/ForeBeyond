import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PaymentPageClient } from "@/components/stays/PaymentPageClient";
import type { PublicListing, StayBooking, Trip } from "@/types/database";

export const metadata = { title: "Trip Payment" };

export default async function TripPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/trips/${id}/payment`);

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .eq("traveler_id", user.id)
    .single();

  if (!trip) notFound();

  const typedTrip = trip as Trip;

  const [{ data: booking }, { data: listing }] = await Promise.all([
    supabase.from("stay_bookings").select("*").eq("trip_id", id).single(),
    typedTrip.listing_id
      ? supabase.from("public_listings").select("title").eq("id", typedTrip.listing_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!booking) notFound();

  return (
    <PaymentPageClient
      tripId={id}
      booking={booking as StayBooking}
      listingTitle={(listing as Pick<PublicListing, "title"> | null)?.title ?? null}
    />
  );
}
