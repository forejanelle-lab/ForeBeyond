"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, CreditCard, ImagePlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { dispatchHostAlert } from "@/lib/dispatch-host-alert";
import {
  calculateStayWithServiceFee,
  formatCurrency,
  formatDateRange,
  formatStayRateLabel,
  formatStayRequestMessage,
  missingPricingMessage,
  pickListingPricing,
} from "@/lib/stay-requests";
import { StayDateRangePicker } from "@/components/stays/StayDateRangePicker";
import { StayRequestMediaUpload, type DraftStayRequestPhoto } from "@/components/stays/StayRequestMediaUpload";
import { StayTravelerPricingBreakdown } from "@/components/stays/StayTravelerPricingBreakdown";
import { useTodayIso } from "@/hooks/use-today-iso";
import {
  findStayDateConflict,
  getStayDateConflictMessage,
  type BlockedDateRange,
} from "@/lib/stay-availability";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PublicListing } from "@/types/database";

interface RequestStayWizardProps {
  listing: Pick<
    PublicListing,
    | "id"
    | "host_id"
    | "title"
    | "city"
    | "country"
    | "budget_per_night"
    | "budget_per_night_3_guests"
    | "budget_per_night_4_guests"
    | "budget_per_night_5_guests"
    | "budget_per_night_6_plus_guests"
    | "max_capacity"
    | "host_first_name"
  >;
  userId?: string | null;
  blockedDateRanges?: BlockedDateRange[];
  profileBio?: string | null;
  profileStayMotivation?: string | null;
}

export function RequestStayWizard({
  listing,
  userId,
  blockedDateRanges = [],
  profileBio = null,
  profileStayMotivation = null,
}: RequestStayWizardProps) {
  const router = useRouter();
  const minDate = useTodayIso();
  const [step, setStep] = useState(0);
  const [intro, setIntro] = useState(profileBio?.trim() ?? "");
  const [stayMotivation, setStayMotivation] = useState(profileStayMotivation?.trim() ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [mediaNote, setMediaNote] = useState("");
  const [draftPhotos, setDraftPhotos] = useState<DraftStayRequestPhoto[]>([]);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const steps = [
    "Introduce Yourself",
    "Select Dates",
    "Photos & Video",
    "Review Pricing",
    "Payment Info",
    "Submit Request",
  ];

  const listingPricing = useMemo(() => pickListingPricing(listing), [listing]);
  const maxGuests = listing.max_capacity && listing.max_capacity > 0 ? listing.max_capacity : 8;

  const pricing = useMemo(() => {
    if (!startDate || !endDate || endDate <= startDate) return null;
    const guests = parseInt(guestCount, 10) || 1;
    return calculateStayWithServiceFee(listingPricing, startDate, endDate, guests);
  }, [listingPricing, startDate, endDate, guestCount]);

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

    if (user.id === listing.host_id) {
      setError("You cannot request a stay at your own listing.");
      setIsLoading(false);
      return;
    }

    const guests = parseInt(guestCount, 10) || 1;
    const conflict = findStayDateConflict(startDate, endDate, blockedDateRanges);
    if (conflict) {
      setError(getStayDateConflictMessage(conflict));
      setIsLoading(false);
      return;
    }

    const fullMessage = formatStayRequestMessage({
      intro: intro.trim(),
      motivation: stayMotivation.trim(),
      mediaNote: mediaNote.trim() || null,
    });

    const { data, error: insertError } = await supabase
      .from("stay_requests")
      .insert({
        traveler_id: user.id,
        host_id: listing.host_id,
        listing_id: listing.id,
        message: fullMessage,
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

    if (draftPhotos.length > 0) {
      const { error: photosError } = await supabase.from("stay_request_photos").insert(
        draftPhotos.map((photo, index) => ({
          stay_request_id: data.id,
          file_url: photo.file_url,
          sort_order: index,
        }))
      );

      if (photosError) {
        setError(photosError.message);
        setIsLoading(false);
        return;
      }
    }

    setSubmittedId(data.id);
    setIsLoading(false);
    dispatchHostAlert({ event: "stay_request_submitted", stayRequestId: data.id });
    trackEvent(AnalyticsEvents.REQUEST_SUBMISSION, {
      listing_id: listing.id,
      request_id: data.id,
    });
  }

  function validateDates(): string | null {
    if (!startDate || !endDate) return "Please select check-in and check-out dates.";
    if (minDate && startDate < minDate) return "Check-in cannot be in the past.";
    if (minDate && endDate < minDate) return "Check-out cannot be in the past.";
    if (endDate <= startDate) return "Check-out must be after check-in.";
    const conflict = findStayDateConflict(startDate, endDate, blockedDateRanges);
    if (conflict) return getStayDateConflictMessage(conflict);
    return null;
  }

  function applyDateSelection(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    if (nextStart && nextEnd && nextEnd > nextStart) {
      const conflict = findStayDateConflict(nextStart, nextEnd, blockedDateRanges);
      setError(conflict ? getStayDateConflictMessage(conflict) : "");
    } else {
      setError("");
    }
  }

  async function handleNext() {
    if (step === 0) {
      if (intro.trim().length < 20) {
        setError("Please write at least a few sentences introducing yourself.");
        return;
      }
      if (stayMotivation.trim().length < 20) {
        setError("Please share why you're interested in staying with a host family.");
        return;
      }
    }
    if (step === 1) {
      const dateError = validateDates();
      if (dateError) {
        setError(dateError);
        return;
      }
      const guests = parseInt(guestCount, 10) || 1;
      if (!calculateStayWithServiceFee(listingPricing, startDate, endDate, guests)) {
        setError(missingPricingMessage(guests));
        return;
      }
    }
    if (step === 4) {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        setError("Please enter your card details. You won't be charged until both parties approve.");
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
          You won&apos;t be charged until you both approve the final stay.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <ButtonLink href={`/dashboard/requests/${submittedId}`} variant="primary" size="md" className="w-full">
            View request status
          </ButtonLink>
          <ButtonLink href="/search" variant="secondary" size="md" className="w-full">
            Browse more families
          </ButtonLink>
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
        <ButtonLink
          href={`/auth/sign-in?redirect=/families/${listing.id}/request`}
          variant="primary"
          size="md"
          className="w-full"
        >
          Sign in to request stay
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md">
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-forest" : i < step ? "w-2 bg-forest/40" : "w-2 bg-sage-dark"
              }`}
            />
            <span
              className={`text-[10px] hidden md:inline ${
                i === step ? "text-forest font-medium" : "text-charcoal-light"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-charcoal-light mb-4">
        Requesting stay at <span className="font-medium text-forest">{listing.title}</span>
        {" · "}
        {formatStayRateLabel(listingPricing, parseInt(guestCount, 10) || 1)}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <Textarea
            label="About me"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="Share who you are, your background, and anything the host should know about you..."
            required
          />
          <Textarea
            label="What are you hoping to get from this stay?"
            value={stayMotivation}
            onChange={(e) => setStayMotivation(e.target.value)}
            placeholder="Why are you interested in staying with this family? What do you want to experience or learn?"
            hint="Help the host understand your goals for this homestay"
            required
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <StayDateRangePicker
            minDate={minDate}
            startDate={startDate}
            endDate={endDate}
            blockedRanges={blockedDateRanges}
            onChange={applyDateSelection}
          />
          <Input
            label="Guests"
            type="number"
            min="1"
            max={String(maxGuests)}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            hint={listing.max_capacity ? `This family hosts up to ${listing.max_capacity} guests` : undefined}
            required
          />
          {pricing ? (
            <StayTravelerPricingBreakdown
              rateLabel={pricing.rateLabel}
              nights={pricing.nights}
              guestCount={pricing.guestCount}
              subtotal={pricing.subtotal}
              serviceFee={pricing.serviceFee}
              showDueAtConfirmation={false}
            />
          ) : (
            startDate &&
            endDate &&
            endDate > startDate && (
              <p className="rounded-xl bg-sage/40 p-4 text-sm text-charcoal-light">
                {missingPricingMessage(parseInt(guestCount, 10) || 1)}
              </p>
            )
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-sage-dark p-6 text-center">
            <ImagePlus className="h-8 w-8 text-forest mx-auto mb-2" />
            <p className="text-sm font-medium text-forest">Optional photos</p>
            <p className="text-xs text-charcoal-light mt-1 max-w-sm mx-auto">
              Help your host get to know you. Upload family photos or add links to videos below.
            </p>
          </div>
          {userId ? (
            <StayRequestMediaUpload
              userId={userId}
              photos={draftPhotos}
              onPhotosChange={setDraftPhotos}
            />
          ) : (
            <p className="text-sm text-charcoal-light rounded-xl bg-sage/30 px-4 py-3">
              Sign in to upload photos with your request.
            </p>
          )}
          <Textarea
            label="Video links or notes (optional)"
            value={mediaNote}
            onChange={(e) => setMediaNote(e.target.value)}
            placeholder="e.g. Short intro video URL..."
          />
        </div>
      )}

      {step === 3 && pricing && (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-forest">Price breakdown</p>
          <div className="rounded-xl bg-sage/40 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateRange(startDate, endDate)}
              </span>
              <span>{pricing.nights} nights</span>
            </div>
          </div>
          <StayTravelerPricingBreakdown
            rateLabel={pricing.rateLabel}
            nights={pricing.nights}
            guestCount={pricing.guestCount}
            subtotal={pricing.subtotal}
            serviceFee={pricing.serviceFee}
            className="mt-0"
          />
          <p className="flex items-center gap-1.5 text-charcoal-light">
            <Users className="h-3.5 w-3.5" />
            {guestCount} guest{guestCount !== "1" ? "s" : ""}
          </p>
          <p className="text-xs text-charcoal-light">
            Stay payment is paid directly to your host. The service fee is non-refundable once both
            parties accept the request.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 text-sm text-charcoal-light bg-sage/30 rounded-xl p-4">
            <CreditCard className="h-5 w-5 text-forest shrink-0 mt-0.5" />
            <p>
              Your card will <strong className="text-forest">not</strong> be charged until both you
              and the host approve the final stay. The service fee is charged at confirmation and is
              non-refundable once both parties accept.
            </p>
          </div>
          <Input
            label="Name on card"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
          <Input
            label="Card number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              placeholder="MM/YY"
              required
            />
            <Input
              label="CVC"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              placeholder="123"
              required
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-forest">Review your request</p>
          <div className="rounded-xl bg-sage/40 p-4 space-y-2">
            <p><strong>Introduction:</strong> {intro.slice(0, 120)}{intro.length > 120 ? "…" : ""}</p>
            <p><strong>Why this stay:</strong> {stayMotivation.slice(0, 120)}{stayMotivation.length > 120 ? "…" : ""}</p>
            <p className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateRange(startDate, endDate)}
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {guestCount} guest{guestCount !== "1" ? "s" : ""}
            </p>
            {pricing && (
              <>
                <p>
                  <strong>Remaining due to host:</strong> {formatCurrency(pricing.subtotal)}
                </p>
                <p>
                  <strong>Service fee at confirmation:</strong> {formatCurrency(pricing.serviceFee)}
                </p>
              </>
            )}
          </div>
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
