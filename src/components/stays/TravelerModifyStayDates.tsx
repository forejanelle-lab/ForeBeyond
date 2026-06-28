"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateStayRequestDatesByTraveler } from "@/lib/stay-request-dates";
import { dispatchHostAlert } from "@/lib/dispatch-host-alert";
import { todayIso } from "@/lib/messaging";
import { BlockedDatesNotice } from "@/components/stays/BlockedDatesNotice";
import {
  findStayDateConflict,
  getStayDateConflictMessage,
  type BlockedDateRange,
} from "@/lib/stay-availability";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { StayRequest } from "@/types/database";

interface TravelerModifyStayDatesProps {
  request: Pick<StayRequest, "id" | "traveler_id" | "status" | "start_date" | "end_date">;
  blockedDateRanges?: BlockedDateRange[];
}

export function TravelerModifyStayDates({
  request,
  blockedDateRanges = [],
}: TravelerModifyStayDatesProps) {
  const router = useRouter();
  const minDate = todayIso();
  const [startDate, setStartDate] = useState(request.start_date ?? "");
  const [endDate, setEndDate] = useState(request.end_date ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function applyDateSelection(nextStart: string, nextEnd: string) {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setSuccess("");
    if (nextStart && nextEnd && nextEnd > nextStart) {
      const conflict = findStayDateConflict(nextStart, nextEnd, blockedDateRanges);
      setError(conflict ? getStayDateConflictMessage(conflict) : "");
    } else {
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: updateError } = await updateStayRequestDatesByTraveler(
      supabase,
      request as StayRequest,
      startDate,
      endDate,
      blockedDateRanges
    );

    if (updateError) {
      setError(updateError);
      setIsLoading(false);
      return;
    }

    setSuccess("Dates updated. Your host will review the new dates.");
    dispatchHostAlert({ event: "stay_dates_changed", stayRequestId: request.id });
    setIsLoading(false);
    router.refresh();
  }

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <div>
        <p className="font-medium text-forest flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Modify stay dates
        </p>
        <p className="text-sm text-charcoal-light mt-1">
          Changing dates sends your request back to the host for approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <BlockedDatesNotice blockedRanges={blockedDateRanges} />
        <Input
          label="Check-in"
          type="date"
          min={minDate}
          value={startDate}
          onChange={(e) => {
            const nextStart = e.target.value;
            const nextEnd = endDate && nextStart >= endDate ? "" : endDate;
            applyDateSelection(nextStart, nextEnd);
          }}
          required
        />
        <Input
          label="Check-out"
          type="date"
          min={startDate || minDate}
          value={endDate}
          onChange={(e) => applyDateSelection(startDate, e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-forest bg-sage/40 rounded-lg px-4 py-3">{success}</p>
        )}

        <Button type="submit" variant="secondary" size="md" className="w-full" isLoading={isLoading}>
          Update dates
        </Button>
      </form>
    </Card>
  );
}
