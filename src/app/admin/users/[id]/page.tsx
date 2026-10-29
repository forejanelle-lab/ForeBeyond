import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { privatePageMetadata } from "@/lib/site-metadata";
import { formatReferralAttribution } from "@/lib/referral";
import { resolveListingPricingCurrency } from "@/lib/currency";
import type {
  HostListing,
  Profile,
  ReferralLink,
  StayBooking,
  StayRequest,
  Trip,
  UserLoginEvent,
  VerificationDocument,
} from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name").eq("id", id).single();
  const title = data?.full_name ? `Admin — ${data.full_name}` : "Admin — User";
  return privatePageMetadata({
    title,
    description: "User details in Fore Beyond admin.",
    path: `/admin/users/${id}`,
  });
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const { message } = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, is_admin, verification_status, trust_score, bio, location, created_at, last_login_at, last_active_at"
    )
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const typedProfile = profile as Pick<
    Profile,
    | "id"
    | "full_name"
    | "email"
    | "role"
    | "is_admin"
    | "verification_status"
    | "trust_score"
    | "bio"
    | "location"
    | "created_at"
    | "last_login_at"
    | "last_active_at"
  >;

  const [{ data: guestTrips }, { data: hostTrips }, { data: loginEvents }, { data: verificationDocuments }] =
    await Promise.all([
    supabase
      .from("trips")
      .select("id, status, start_date, end_date, listing_id, host_id, stay_request_id")
      .eq("traveler_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("trips")
      .select("id, status, start_date, end_date, listing_id, traveler_id, stay_request_id")
      .eq("host_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("user_login_events")
      .select("id, logged_in_at, ip_address, user_agent, auth_method")
      .eq("user_id", id)
      .order("logged_in_at", { ascending: false })
      .limit(50),
    supabase
      .from("verification_documents")
      .select("id, document_type, file_url, status, created_at, reviewed_at, notes")
      .eq("user_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const guestTripRows = (guestTrips as Trip[]) ?? [];
  const hostTripRows = (hostTrips as Trip[]) ?? [];
  const allTrips = [...guestTripRows, ...hostTripRows];
  const tripIds = allTrips.map((t) => t.id);
  const listingIds = [...new Set(allTrips.map((t) => t.listing_id).filter(Boolean) as string[])];
  const otherUserIds = [
    ...new Set([
      ...guestTripRows.map((t) => t.host_id),
      ...hostTripRows.map((t) => t.traveler_id),
    ]),
  ];
  const stayRequestIds = [
    ...new Set(allTrips.map((t) => t.stay_request_id).filter(Boolean) as string[]),
  ];

  const [{ data: listings }, { data: profiles }, { data: bookings }, { data: conversations }, { data: referredRequests }] =
    await Promise.all([
      listingIds.length
        ? supabase
            .from("host_listings")
            .select("id, title, pricing_currency, country")
            .in("id", listingIds)
        : Promise.resolve({ data: [] }),
      otherUserIds.length
        ? supabase.from("profiles").select("id, full_name").in("id", otherUserIds)
        : Promise.resolve({ data: [] }),
      tripIds.length
        ? supabase
            .from("stay_bookings")
            .select("trip_id, nightly_rate, total_amount, referral_link_id")
            .in("trip_id", tripIds)
            .then((result) =>
              result.error
                ? supabase
                    .from("stay_bookings")
                    .select("trip_id, nightly_rate, total_amount")
                    .in("trip_id", tripIds)
                : result
            )
        : Promise.resolve({ data: [] }),
      stayRequestIds.length
        ? supabase.from("conversations").select("id, stay_request_id").in("stay_request_id", stayRequestIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("stay_requests")
        .select("referral_link_id")
        .eq("traveler_id", id)
        .not("referral_link_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .then((result) => (result.error ? { data: [] } : result)),
    ]);

  const listingById = Object.fromEntries(
    (
      (listings as Pick<HostListing, "id" | "title" | "pricing_currency" | "country">[]) ?? []
    ).map((listing) => [listing.id, listing])
  );
  const nameById = Object.fromEntries(
    ((profiles as Pick<Profile, "id" | "full_name">[]) ?? []).map((p) => [p.id, p.full_name])
  );
  const bookingRows =
    (bookings as Pick<StayBooking, "trip_id" | "nightly_rate" | "total_amount" | "referral_link_id">[]) ??
    [];
  const bookingByTrip = Object.fromEntries(bookingRows.map((b) => [b.trip_id, b]));
  const conversationByRequest = Object.fromEntries(
    ((conversations as { id: string; stay_request_id: string }[]) ?? []).map((c) => [
      c.stay_request_id,
      c.id,
    ])
  );

  const referralIds = [
    ...new Set(
      [
        ...bookingRows.map((booking) => booking.referral_link_id),
        ...(((referredRequests as Pick<StayRequest, "referral_link_id">[]) ?? []).map(
          (request) => request.referral_link_id
        )),
      ].filter(Boolean) as string[]
    ),
  ];

  const { data: referralLinks } = referralIds.length
    ? await supabase.from("referral_links").select("id, name, code").in("id", referralIds)
    : { data: [] };

  const referralById = Object.fromEntries(
    ((referralLinks as Pick<ReferralLink, "id" | "name" | "code">[]) ?? []).map((link) => [
      link.id,
      formatReferralAttribution(link),
    ])
  );

  function referralLabelFor(referralLinkId: string | null | undefined) {
    return referralLinkId ? referralById[referralLinkId] ?? null : null;
  }

  const tripSummaries = [
    ...guestTripRows.map((trip) => {
      const booking = bookingByTrip[trip.id];
      return {
        id: trip.id,
        role: "guest" as const,
        listingTitle: trip.listing_id ? listingById[trip.listing_id]?.title ?? null : null,
        otherPartyName: nameById[trip.host_id] ?? null,
        startDate: trip.start_date,
        endDate: trip.end_date,
        status: trip.status,
        nightlyRate: booking?.nightly_rate ?? null,
        totalAmount: booking?.total_amount ?? null,
        pricingCurrency: resolveListingPricingCurrency(
          trip.listing_id ? listingById[trip.listing_id] ?? {} : {}
        ),
        conversationId: trip.stay_request_id
          ? conversationByRequest[trip.stay_request_id] ?? null
          : null,
        referralLabel: referralLabelFor(booking?.referral_link_id),
      };
    }),
    ...hostTripRows.map((trip) => {
      const booking = bookingByTrip[trip.id];
      return {
        id: trip.id,
        role: "host" as const,
        listingTitle: trip.listing_id ? listingById[trip.listing_id]?.title ?? null : null,
        otherPartyName: nameById[trip.traveler_id] ?? null,
        startDate: trip.start_date,
        endDate: trip.end_date,
        status: trip.status,
        nightlyRate: booking?.nightly_rate ?? null,
        totalAmount: booking?.total_amount ?? null,
        pricingCurrency: resolveListingPricingCurrency(
          trip.listing_id ? listingById[trip.listing_id] ?? {} : {}
        ),
        conversationId: trip.stay_request_id
          ? conversationByRequest[trip.stay_request_id] ?? null
          : null,
        referralLabel: referralLabelFor(booking?.referral_link_id),
      };
    }),
  ];

  const requestReferralLabel = referralLabelFor(
    ((referredRequests as Pick<StayRequest, "referral_link_id">[]) ?? [])[0]?.referral_link_id
  );

  return (
    <AdminShell title={typedProfile.full_name ?? "User"} description={typedProfile.email}>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All users
      </Link>
      <AdminUserDetail
        profile={typedProfile}
        loginEvents={
          (loginEvents as Pick<
            UserLoginEvent,
            "id" | "logged_in_at" | "ip_address" | "user_agent" | "auth_method"
          >[]) ?? []
        }
        trips={tripSummaries}
        verificationDocuments={
          (verificationDocuments as Pick<
            VerificationDocument,
            | "id"
            | "document_type"
            | "file_url"
            | "status"
            | "created_at"
            | "reviewed_at"
            | "notes"
          >[]) ?? []
        }
        showMessagePrompt={message === "1"}
        referralLabel={requestReferralLabel}
      />
    </AdminShell>
  );
}
