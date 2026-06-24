"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  approveStayRequest,
  declineStayRequest,
  respondToStayRequest,
} from "@/lib/stay-approval";
import { formatCurrency } from "@/lib/stay-requests";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import type { StayRequest } from "@/types/database";

interface HostRequestActionsProps {
  request: StayRequest;
  nightlyRate: number | null;
}

export function HostRequestActions({ request, nightlyRate }: HostRequestActionsProps) {
  const router = useRouter();
  const [response, setResponse] = useState(request.host_response ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (request.status !== "pending") {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">
          This request has been {request.status === "rejected" ? "declined" : request.status}.
        </p>
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
    const { error: approveError, tripId } = await approveStayRequest(
      supabase,
      request,
      nightlyRate,
      response
    );
    if (approveError) {
      setError(approveError);
      setIsLoading(null);
      return;
    }
    setIsLoading(null);
    router.push(tripId ? `/trips/${tripId}` : "/host/requests");
    router.refresh();
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
    if (declineError) {
      setError(declineError);
      setIsLoading(null);
      return;
    }
    setIsLoading(null);
    router.refresh();
  }

  async function handleRespond() {
    if (!response.trim()) {
      setError("Write a message before responding.");
      return;
    }
    setError("");
    setIsLoading("respond");
    const supabase = createClient();
    const { error: respondError } = await respondToStayRequest(
      supabase,
      request.id,
      request.host_id,
      response
    );
    if (respondError) {
      setError(respondError);
      setIsLoading(null);
      return;
    }
    setIsLoading(null);
    router.refresh();
  }

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <div>
        <h3 className="font-semibold text-forest">Review request</h3>
        <p className="text-sm text-charcoal-light mt-1">
          Approve to create a trip and booking ({formatCurrency(nightlyRate)}/night).
          Decline or respond with questions first.
        </p>
      </div>

      <Textarea
        label="Response to traveler"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Welcome message, questions, or decline reason..."
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={handleApprove}
          isLoading={isLoading === "approve"}
          className="w-full"
        >
          <Check className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRespond}
          isLoading={isLoading === "respond"}
          className="w-full"
        >
          <MessageSquare className="h-4 w-4" />
          Respond
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={handleDecline}
          isLoading={isLoading === "decline"}
          className="w-full"
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
      <p className="font-medium text-forest">Your stay is approved!</p>
      <div className="flex flex-col gap-2">
        <Link href={`/trips/${tripId}`}>
          <Button variant="primary" size="md" className="w-full">
            View trip & messaging
          </Button>
        </Link>
        <Link href={`/trips/${tripId}/payment`}>
          <Button variant="secondary" size="md" className="w-full">
            Complete payment
          </Button>
        </Link>
      </div>
    </Card>
  );
}
