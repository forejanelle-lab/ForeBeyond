"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { TripListCard } from "@/components/trips/TripListCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PublicListing, StayBooking, Trip } from "@/types/database";

type TripRow = Trip & {
  listing: Pick<PublicListing, "id" | "title" | "city" | "country"> | null;
  booking: Pick<StayBooking, "total_amount" | "payment_status"> | null;
  coverPhotoUrl: string | null;
};

interface TripsListViewProps {
  trips: TripRow[];
}

function downloadInvoice(trip: TripRow) {
  const bookingRef = trip.stay_request_id?.slice(0, 8).toUpperCase() ?? trip.id.slice(0, 8).toUpperCase();
  const lines = [
    "FORE BEYOND — TRIP INVOICE",
    "",
    `Booking reference: ${bookingRef}`,
    `Trip ID: ${trip.id}`,
    `Family: ${trip.listing?.title ?? "N/A"}`,
    `Location: ${[trip.listing?.city, trip.listing?.country].filter(Boolean).join(", ") || "N/A"}`,
    `Dates: ${trip.start_date} to ${trip.end_date}`,
    `Status: ${trip.status}`,
    trip.booking ? `Total: $${trip.booking.total_amount}` : "",
    trip.booking ? `Payment: ${trip.booking.payment_status}` : "",
    "",
    "Deposit to host is coordinated directly between traveler and host within one week of travel.",
    "Fore Beyond service fee is charged only after both parties approve the stay.",
  ].filter(Boolean);

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fore-beyond-trip-${trip.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TripsListView({ trips }: TripsListViewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date-desc" | "date-asc" | "status">("date-desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = trips.filter((trip) => {
      if (!q) return true;
      const hay = [
        trip.listing?.title,
        trip.listing?.city,
        trip.listing?.country,
        trip.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "status") return a.status.localeCompare(b.status);
      const da = new Date(a.start_date ?? 0).getTime();
      const db = new Date(b.start_date ?? 0).getTime();
      return sort === "date-asc" ? da - db : db - da;
    });

    return rows;
  }, [trips, query, sort]);

  if (trips.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-12">
        <p className="text-charcoal-light">No trips yet. Request a stay with a host family to get started.</p>
        <Link href="/search" className="inline-block mt-4 text-sm font-medium text-forest hover:underline">
          Browse families
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trips by family, city, or status..."
            className="pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="status">By status</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((trip) => (
          <div key={trip.id} className="space-y-2">
            <TripListCard
              trip={trip}
              listing={trip.listing}
              booking={trip.booking}
              coverPhotoUrl={trip.coverPhotoUrl}
              listingId={trip.listing?.id ?? trip.listing_id}
            />
            {trip.status === "completed" && (
              <div className="flex justify-end pr-1">
                <Button variant="outline" size="sm" onClick={() => downloadInvoice(trip)}>
                  <Download className="h-4 w-4" />
                  Download invoice
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
