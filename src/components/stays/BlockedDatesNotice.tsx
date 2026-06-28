import { CalendarX } from "lucide-react";
import { formatDateRange } from "@/lib/stay-requests";
import type { BlockedDateRange } from "@/lib/stay-availability";

interface BlockedDatesNoticeProps {
  blockedRanges: BlockedDateRange[];
}

export function BlockedDatesNotice({ blockedRanges }: BlockedDatesNoticeProps) {
  const hostUnavailable = blockedRanges.filter((range) => range.source === "host_unavailable");
  const confirmedStays = blockedRanges.filter(
    (range) => range.source !== "host_unavailable"
  );

  if (hostUnavailable.length === 0 && confirmedStays.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm space-y-3">
      <p className="flex items-center gap-2 font-medium text-forest">
        <CalendarX className="h-4 w-4 shrink-0" />
        Some dates are unavailable
      </p>

      {hostUnavailable.length > 0 && (
        <div>
          <p className="text-charcoal-light">
            The host is not available during:
          </p>
          <ul className="mt-2 space-y-1 text-charcoal">
            {hostUnavailable.map((range) => (
              <li key={`host-${range.start_date}-${range.end_date}`}>
                {formatDateRange(range.start_date, range.end_date)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmedStays.length > 0 && (
        <div>
          <p className="text-charcoal-light">
            Confirmed stays already block:
          </p>
          <ul className="mt-2 space-y-1 text-charcoal">
            {confirmedStays.map((range) => (
              <li key={`stay-${range.start_date}-${range.end_date}`}>
                {formatDateRange(range.start_date, range.end_date)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
