"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DisplayExperiencePrice } from "@/components/i18n/DisplayMoney";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import type { PublicExperience } from "@/types/database";

interface BookExperienceFormProps {
  experience: PublicExperience;
  profileBio?: string | null;
}

export function BookExperienceForm({ experience, profileBio = null }: BookExperienceFormProps) {
  const router = useRouter();
  const [scheduledDate, setScheduledDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [message, setMessage] = useState(profileBio?.trim() ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=/experiences/${experience.id}`);
      setIsLoading(false);
      return;
    }

    const guests = parseInt(guestCount, 10) || 1;
    const totalPrice =
      experience.price_per_person != null
        ? experience.price_per_person * guests
        : null;

    const { error: bookingError } = await supabase.from("experience_bookings").insert({
      experience_id: experience.id,
      host_id: experience.host_id,
      traveler_id: user.id,
      scheduled_date: scheduledDate,
      guest_count: guests,
      message: message.trim() || null,
      total_price: totalPrice,
    });

    if (bookingError) {
      setError(bookingError.message);
      setIsLoading(false);
      return;
    }

    posthog.capture("experience_booking_requested", {
      experience_id: experience.id,
      guest_count: guests,
    });

    setSuccess(true);
    setIsLoading(false);
  }

  if (success) {
    return (
      <Card variant="outline" padding="md" className="text-center">
        <Calendar className="h-8 w-8 text-forest mx-auto mb-3" />
        <p className="font-medium text-forest">Booking request sent!</p>
        <p className="text-sm text-charcoal-light mt-2">
          The host will review your request and confirm your experience date.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <h3 className="font-semibold text-forest mb-1">Book this experience</h3>
      <p className="text-sm text-charcoal-light mb-4">
        {experience.visibility === "approved_guests_only" ? (
          <>
            Because of your accommodation booking, you have the option to connect more with your
            Beyond family.
          </>
        ) : (
          <>Book independently — no accommodation required.</>
        )}{" "}
        {experience.price_per_person != null && (
          <span className="font-medium text-forest">
            <DisplayExperiencePrice priceUsd={experience.price_per_person} />
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Preferred date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          required
        />
        <Input
          label="Number of guests"
          type="number"
          min="1"
          max={String(experience.max_guests)}
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          required
        />
        <Textarea
          label="About me"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share dietary needs, language preferences, or questions..."
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
          Request to Book
        </Button>
      </form>
    </Card>
  );
}
