"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { withdrawApprovedStay } from "@/lib/stay-approval";
import { formatDateRange } from "@/lib/stay-requests";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { StayRequest } from "@/types/database";

interface HostWithdrawStayModalProps {
  open: boolean;
  request: Pick<StayRequest, "id" | "host_id" | "start_date" | "end_date">;
  guestName: string;
  onClose: () => void;
  onWithdrawn: () => void;
}

export function HostWithdrawStayModal({
  open,
  request,
  guestName,
  onClose,
  onWithdrawn,
}: HostWithdrawStayModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleWithdraw() {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Please explain why you are withdrawing (at least 10 characters).");
      return;
    }

    setError("");
    setIsLoading(true);
    const supabase = createClient();
    const { error: withdrawError } = await withdrawApprovedStay(
      supabase,
      request.id,
      request.host_id,
      trimmed
    );

    if (withdrawError) {
      setError(withdrawError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onWithdrawn();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close withdraw dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-stay-title"
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="withdraw-stay-title" className="text-lg font-semibold text-forest">
              Withdraw confirmed stay
            </h2>
            <p className="text-sm text-charcoal-light mt-1">
              This cancels the confirmed stay with {guestName}
              {request.start_date && request.end_date
                ? ` (${formatDateRange(request.start_date, request.end_date)})`
                : ""}
              . The guest will receive a notification with your explanation.
            </p>
          </div>
        </div>

        <Textarea
          label="Reason for withdrawal (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you need to cancel this confirmed stay. This message is sent to the guest."
          required
        />

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
            Keep stay
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleWithdraw}
            isLoading={isLoading}
            className="flex-1 bg-red-700 hover:bg-red-800"
          >
            Withdraw stay
          </Button>
        </div>
      </div>
    </div>
  );
}
