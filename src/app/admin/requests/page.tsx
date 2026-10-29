import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBadgeCell, AdminDateCell, AdminTable } from "@/components/admin/AdminTable";
import { privatePageMetadata } from "@/lib/site-metadata";
import { formatDateRange, STAY_REQUEST_STATUS_LABELS } from "@/lib/stay-requests";
import type { HostListing, Profile, StayRequest, StayRequestStatus } from "@/types/database";

const OPEN_STATUSES: StayRequestStatus[] = ["pending", "host_approved", "approved"];

export const metadata = privatePageMetadata({
  title: "Admin — Stay requests",
  description: "Open stay requests on Fore Beyond.",
  path: "/admin/requests",
});

type RequestRow = Pick<
  StayRequest,
  | "id"
  | "traveler_id"
  | "host_id"
  | "listing_id"
  | "status"
  | "start_date"
  | "end_date"
  | "guest_count"
  | "created_at"
>;

export default async function AdminStayRequestsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stay_requests")
    .select(
      "id, traveler_id, host_id, listing_id, status, start_date, end_date, guest_count, created_at"
    )
    .in("status", OPEN_STATUSES)
    .order("created_at", { ascending: false });

  const requests = (data as RequestRow[] | null) ?? [];
  const travelerIds = [...new Set(requests.map((request) => request.traveler_id))];
  const hostIds = [...new Set(requests.map((request) => request.host_id))];
  const profileIds = [...new Set([...travelerIds, ...hostIds])];
  const listingIds = [
    ...new Set(requests.map((request) => request.listing_id).filter(Boolean) as string[]),
  ];
  const requestIds = requests.map((request) => request.id);

  const [{ data: profiles }, { data: listings }, { data: trips }] = await Promise.all([
    profileIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    listingIds.length
      ? supabase.from("host_listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      ? supabase.from("trips").select("id, stay_request_id").in("stay_request_id", requestIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = Object.fromEntries(
    ((profiles as Pick<Profile, "id" | "full_name">[]) ?? []).map((profile) => [
      profile.id,
      profile.full_name,
    ])
  );
  const titleById = Object.fromEntries(
    ((listings as Pick<HostListing, "id" | "title">[]) ?? []).map((listing) => [
      listing.id,
      listing.title,
    ])
  );
  const tripIdByRequest = Object.fromEntries(
    ((trips as { id: string; stay_request_id: string | null }[]) ?? [])
      .filter((trip) => trip.stay_request_id)
      .map((trip) => [trip.stay_request_id as string, trip.id])
  );

  const rows = requests.map((request) => ({
    ...request,
    travelerName: nameById[request.traveler_id] ?? "Traveler",
    hostName: nameById[request.host_id] ?? "Host",
    listingTitle: request.listing_id ? titleById[request.listing_id] ?? "Listing" : "—",
    tripId: tripIdByRequest[request.id] ?? null,
  }));

  return (
    <AdminShell
      title="Stay requests"
      description="Requests waiting on a host reply, traveler confirmation, or an upcoming stay."
    >
      <AdminTable
        rows={rows}
        wide
        emptyMessage="No open stay requests."
        columns={[
          {
            key: "traveler",
            label: "Traveler",
            render: (row) => (
              <Link href={`/admin/users/${row.traveler_id}`} className="text-forest hover:underline">
                {row.travelerName}
              </Link>
            ),
          },
          {
            key: "host",
            label: "Host",
            render: (row) => (
              <Link href={`/admin/users/${row.host_id}`} className="text-forest hover:underline">
                {row.hostName}
              </Link>
            ),
          },
          {
            key: "listing",
            label: "Listing",
            render: (row) => row.listingTitle,
          },
          {
            key: "dates",
            label: "Dates",
            render: (row) => formatDateRange(row.start_date, row.end_date),
          },
          {
            key: "guests",
            label: "Guests",
            render: (row) => String(row.guest_count),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => {
              const status = STAY_REQUEST_STATUS_LABELS[row.status];
              return <AdminBadgeCell label={status.label} variant={status.variant} />;
            },
          },
          {
            key: "sent",
            label: "Sent",
            render: (row) => <AdminDateCell value={row.created_at} />,
          },
          {
            key: "trip",
            label: "",
            render: (row) =>
              row.tripId ? (
                <Link
                  href={`/trips/${row.tripId}?from=${row.traveler_id}`}
                  className="text-forest hover:underline whitespace-nowrap"
                >
                  View trip
                </Link>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </AdminShell>
  );
}
