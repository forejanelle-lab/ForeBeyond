"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { formatBudget } from "@/lib/search";
import { formatDateRange } from "@/lib/stay-requests";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PublicListing } from "@/types/database";

interface RequestStayWizardProps {
  listing: Pick<
    PublicListing,
    "id" | "host_id" | "title" | "city" | "country" | "budget_per_night" | "host_first_name"
  >;
  userId?: string | null;
}

export function RequestStayWizard({ listing, userId }: RequestStayWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [intro, setIntro] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const steps = ["Introduce Yourself", "Select Dates", "Submit Request"];

  async function handleSubmit() {
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/sign-in?redirect=/families/${listing.id}/request`);
      setIsLoading(false);
      return;
    }

    const guests = parseInt(guestCount, 10) || 1;

    const { data, error: insertError } = await supabase
      .from("stay_requests")
      .insert({
        traveler_id: user.id,
        host_id: listing.host_id,
        listing_id: listing.id,
        message: intro.trim(),
        start_date: startDate,
        end_date: endDate,
        guest_count: guests,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setSubmittedId(data.id);
    setIsLoading(false);
    trackEvent(AnalyticsEvents.REQUEST_SUBMISSION, {
      listing_id: listing.id,
      request_id: data.id,
    });
  }

  async function handleNext() {
    if (step === 0 && intro.trim().length < 20) {
      setError("Please write at least a few sentences introducing yourself.");
      return;
    }
    if (step === 1) {
      if (!startDate || !endDate) {
        setError("Please select check-in and check-out dates.");
        return;
      }
      if (endDate <= startDate) {
        setError("Check-out must be after check-in.");
        return;
      }
    }
    setError("");
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  if (submittedId) {
    return (
      <Card variant="outline" padding="md" className="text-center">
        <Badge variant="success" className="mb-3">Request submitted</Badge>
        <p className="font-medium text-forest">Your stay request is pending</p>
        <p className="text-sm text-charcoal-light mt-2">
          {listing.host_first_name ?? "The host"} will review your introduction and dates.
          You&apos;ll be notified when they respond.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Link href={`/dashboard/requests/${submittedId}`}>
            <Button variant="primary" size="md" className="w-full">
              View request status
            </Button>
          </Link>
          <Link href="/dashboard/requests">
            <Button variant="secondary" size="md" className="w-full">
              All my requests
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card variant="outline" padding="md" className="text-center">
        <p className="text-sm text-charcoal-light mb-3">
          Sign in to request a stay with {listing.host_first_name ?? "this family"}.
        </p>
        <Link href={`/auth/sign-in?redirect=/families/${listing.id}/request`}>
          <Button variant="primary" size="md" className="w-full">
            Sign in to request stay
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-forest" : i < step ? "w-3 bg-forest/40" : "w-3 bg-sage-dark"
              }`}
            />
            <span className={`text-xs hidden sm:inline ${i === step ? "text-forest font-medium" : "text-charcoal-light"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-charcoal-light mb-4">
        Requesting stay at <span className="font-medium text-forest">{listing.title}</span>
        {" · "}{formatBudget(listing.budget_per_night)}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <Textarea
            label="Introduce yourself"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Share who you are, why you'd like to stay, your travel interests, and anything the host should know..."
            required
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Check-in"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="Check-out"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <Input
            label="Guests"
            type="number"
            min="1"
            max="8"
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            required
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-forest">Review your request</p>
          <div className="rounded-xl bg-sage/40 p-4 space-y-2">
            <p><strong>Introduction:</strong> {intro.slice(0, 120)}{intro.length > 120 ? "…" : ""}</p>
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateRange(startDate, endDate)}
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {guestCount} guest{guestCount !== "1" ? "s" : ""}
            </p>
          </div>
          <p className="text-charcoal-light">
            The host will review your request and can approve, decline, or respond with questions.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="ghost" size="md" onClick={() => setStep((s) => s - 1)} className="flex-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button variant="primary" size="md" onClick={handleNext} className="flex-1">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleSubmit} isLoading={isLoading} className="flex-1">
            Submit Request
          </Button>
        )}
      </div>
    </Card>
  );
}
