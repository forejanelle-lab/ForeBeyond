"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, X, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  approveStayRequest,
  declineStayRequest,
  revertStayRequest,
} from "@/lib/stay-approval";
import { HostIncomeBreakdown } from "@/components/stays/HostIncomeBreakdown";
import { HostWithdrawStayModal } from "@/components/stays/HostWithdrawStayModal";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import type { ListingPricing } from "@/lib/stay-requests";
import type { StayRequest } from "@/types/database";

interface HostRequestActionsProps {
  request: StayRequest;
  listingPricing: ListingPricing;
  guestName?: string;
}

export function HostRequestActions({
  request,
  listingPricing,
  guestName = "Guest",
}: HostRequestActionsProps) {
  const router = useRouter();
  const [response, setResponse] = useState(request.host_response ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  if (request.status === "rejected") {
    return (
      <Card variant="outline" padding="md" className="space-y-4">
        <p className="text-sm text-charcoal-light">This request was declined.</p>
        {request.host_response && (
          <div className="rounded-xl bg-sage/40 p-3 text-sm">
            <p className="font-medium text-forest mb-1">Your response</p>
            <p className="text-charcoal-light whitespace-pre-wrap">{request.host_response}</p>
          </div>
        )}
        <Button
          variant="secondary"
          size="md"
          className="w-full justify-center"
          isLoading={isLoading === "undo"}
          onClick={async () => {
            setError("");
            setIsLoading("undo");
            const supabase = createClient();
            const { error: undoError } = await revertStayRequest(
              supabase,
              request.id,
              request.host_id
            );
            if (undoError) setError(undoError);
            else router.refresh();
            setIsLoading(null);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Undo decline
        </Button>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}
      </Card>
    );
  }

  if (request.status === "host_approved") {
    return (
      <Card variant="outline" padding="md" className="space-y-3">
        <p className="font-medium text-forest">Awaiting traveler confirmation</p>
        <p className="text-sm text-charcoal-light">
          You approved this request. The traveler will review and confirm the final stay before
          booking is created.
        </p>
        <HostIncomeBreakdown request={request} pricing={listingPricing} />
      </Card>
    );
  }

  if (request.status === "approved") {
    return (
      <>
        <Card variant="outline" padding="md" className="space-y-4">
          <div>
            <p className="font-medium text-forest">Stay confirmed</p>
            <p className="text-sm text-charcoal-light mt-1">
              This guest has confirmed their stay. Withdraw only if you can no longer host these
              dates.
            </p>
          </div>
          <HostIncomeBreakdown request={request} pricing={listingPricing} />
          <Button
            variant="outline"
            size="md"
            className="w-full justify-center border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setShowWithdrawModal(true)}
          >
            <Ban className="h-4 w-4" />
            Withdraw stay
          </Button>
        </Card>
        <HostWithdrawStayModal
          open={showWithdrawModal}
          request={request}
          guestName={guestName}
          onClose={() => setShowWithdrawModal(false)}
          onWithdrawn={() => router.refresh()}
        />
      </>
    );
  }

  if (request.status !== "pending") {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">
          This request has been {request.status === "cancelled" ? "withdrawn" : request.status}.
        </p>
        {request.status === "cancelled" && request.withdrawal_reason && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm">
            <p className="font-medium text-forest mb-1">Withdrawal reason</p>
            <p className="text-charcoal-light whitespace-pre-wrap">{request.withdrawal_reason}</p>
          </div>
        )}
        {request.host_response && (
          <div className="mt-3 rounded-xl bg-sage/40 p-3 text-sm">
            <p className="font-medium text-forest mb-1">Your response</p>
            <p className="text-charcoal-light whitespace-pre-wrap">{request.host_response}</p>
          </div>
        )}
      </Card>
    );
  }

  async function handleApprove() {
    setError("");
    setIsLoading("approve");
    const supabase = createClient();
    const { error: approveError } = await approveStayRequest(
      supabase,
      request,
      response
    );
    if (approveError) setError(approveError);
    else router.refresh();
    setIsLoading(null);
  }

  async function handleDecline() {
    setError("");
    setIsLoading("decline");
    const supabase = createClient();
    const { error: declineError } = await declineStayRequest(
      supabase,
      request.id,
      request.host_id,
      response
    );
    if (declineError) setError(declineError);
    else router.refresh();
    setIsLoading(null);
  }

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <div>
        <h3 className="font-semibold text-forest">Review request</h3>
        <p className="text-sm text-charcoal-light mt-1">
          Approve to send the request back to the traveler for final confirmation. Your payout
          reflects the 12% service charge shown below.
        </p>
      </div>

      <HostIncomeBreakdown request={request} pricing={listingPricing} />

      <Textarea
        label="Note to traveler (optional)"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Welcome message or questions — included when you approve or decline"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-center gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleApprove}
          isLoading={isLoading === "approve"}
          className="w-full sm:w-auto sm:min-w-[8rem] justify-center"
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={handleDecline}
          isLoading={isLoading === "decline"}
          className="w-full sm:w-auto sm:min-w-[8rem] justify-center"
        >
          <X className="h-4 w-4" />
          Decline
        </Button>
      </div>
    </Card>
  );
}

interface ApprovedStayLinksProps {
  tripId: string | null;
}

export function ApprovedStayLinks({ tripId }: ApprovedStayLinksProps) {
  if (!tripId) return null;

  return (
    <Card variant="outline" padding="md" className="space-y-3">
      <p className="font-medium text-forest">Your stay is confirmed!</p>
      <p className="text-xs text-charcoal-light">
        Your service fee has been charged. Coordinate the remaining stay payment directly with
        your host family.
      </p>
      <ButtonLink href={`/trips/${tripId}`} variant="primary" size="md" className="w-full justify-center">
        View trip
      </ButtonLink>
    </Card>
  );
}
