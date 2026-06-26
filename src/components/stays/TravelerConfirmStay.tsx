"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { confirmStayByTraveler } from "@/lib/stay-approval";
import {
  calculateStayWithServiceFee,
  type ListingPricing,
} from "@/lib/stay-requests";
import { StayTravelerPricingBreakdown } from "@/components/stays/StayTravelerPricingBreakdown";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { StayRequest } from "@/types/database";

interface TravelerConfirmStayProps {
  request: StayRequest;
  listingPricing: ListingPricing;
  hostName: string;
}

export function TravelerConfirmStay({ request, listingPricing, hostName }: TravelerConfirmStayProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const pricing =
    request.start_date && request.end_date
      ? calculateStayWithServiceFee(
          listingPricing,
          request.start_date,
          request.end_date,
          request.guest_count
        )
      : null;

  async function handleConfirm() {
    setError("");
    setIsLoading(true);
    const supabase = createClient();
    const { error: confirmError, tripId } = await confirmStayByTraveler(
      supabase,
      request,
      listingPricing
    );
    if (confirmError) {
      setError(confirmError);
      setIsLoading(false);
      return;
    }
    setConfirmed(true);
    setIsLoading(false);
    if (tripId) router.push(`/trips/${tripId}`);
    else router.refresh();
  }

  if (confirmed) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-forest font-medium text-center">Stay confirmed! Redirecting…</p>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <div>
        <p className="font-medium text-forest">{hostName} approved your stay</p>
        <p className="text-sm text-charcoal-light mt-1">
          Review the details and confirm to finalize your booking. You will be charged the Fore
          Beyond service fee now. The service fee is non-refundable once both parties accept.
        </p>
      </div>

      {pricing && (
        <StayTravelerPricingBreakdown
          rateLabel={pricing.rateLabel}
          nights={pricing.nights}
          guestCount={pricing.guestCount}
          subtotal={pricing.subtotal}
          serviceFee={pricing.serviceFee}
          footerNote="Stay payment is coordinated directly with your host. Pay your deposit within one week of travel."
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <Button
        variant="primary"
        size="md"
        className="w-full justify-center"
        onClick={handleConfirm}
        isLoading={isLoading}
        disabled={!pricing}
      >
        <Check className="h-4 w-4" />
        Confirm stay & pay service fee
      </Button>
    </Card>
  );
}
