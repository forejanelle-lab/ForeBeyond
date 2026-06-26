"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/experiences";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ExperienceBooking } from "@/types/database";

interface BookingRow extends ExperienceBooking {
  traveler_name: string;
  experience_title: string;
}

interface HostExperienceBookingsProps {
  bookings: BookingRow[];
  hostId: string;
}

export function HostExperienceBookings({ bookings, hostId }: HostExperienceBookingsProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pending = bookings.filter((b) => b.status === "pending");

  async function updateStatus(bookingId: string, status: "confirmed" | "declined") {
    setError("");
    setLoadingId(bookingId);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("experience_bookings")
      .update({ status })
      .eq("id", bookingId)
      .eq("host_id", hostId);

    if (updateError) setError(updateError.message);
    else router.refresh();
    setLoadingId(null);
  }

  if (bookings.length === 0) return null;

  return (
    <section className="mt-12 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-forest">Experience requests</h2>
        <p className="text-sm text-charcoal-light mt-1">
          {pending.length} pending · {bookings.length} total
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id} variant="outline" padding="md" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <p className="font-semibold text-forest">{booking.traveler_name}</p>
                <p className="text-sm text-charcoal-light">{booking.experience_title}</p>
                <p className="text-xs text-charcoal-light mt-1">
                  {booking.scheduled_date}
                  {booking.scheduled_time ? ` at ${booking.scheduled_time}` : ""}
                  {" · "}
                  {booking.guest_count} guest{booking.guest_count !== 1 ? "s" : ""}
                  {booking.total_price != null && ` · ${formatPrice(booking.total_price)}`}
                </p>
              </div>
              <span className="text-xs font-medium capitalize text-charcoal-light shrink-0">
                {booking.status}
              </span>
            </div>
            {booking.message && (
              <p className="text-sm text-charcoal-light bg-sage/30 rounded-lg px-3 py-2">
                {booking.message}
              </p>
            )}
            {booking.status === "pending" && (
              <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="justify-center"
                  isLoading={loadingId === booking.id}
                  onClick={() => updateStatus(booking.id, "confirmed")}
                >
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  isLoading={loadingId === booking.id}
                  onClick={() => updateStatus(booking.id, "declined")}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
