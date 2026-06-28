import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  formatBookingReference,
  formatCurrency,
  formatDateRange,
  STAY_REQUEST_STATUS_LABELS,
} from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import type { StayRequest } from "@/types/database";

const TRAVELER_STATUS_LABELS: Partial<
  Record<StayRequest["status"], { label: string; variant: "outline" | "success" | "warning" | "default" | "gold" }>
> = {
  pending: { label: "Pending host review", variant: "warning" },
  host_approved: { label: "Confirm stay", variant: "gold" },
};

function statusBadge(request: StayRequest) {
  return (
    TRAVELER_STATUS_LABELS[request.status] ??
    STAY_REQUEST_STATUS_LABELS[request.status] ??
    STAY_REQUEST_STATUS_LABELS.pending
  );
}

export interface TravelerPendingRequestRow {
  request: StayRequest;
  listingTitle: string;
  location: string | null;
  hostName: string | null;
  stayTotal: number | null;
}

interface TravelerPendingRequestTableRowProps extends TravelerPendingRequestRow {
  href: string;
}

export function TravelerPendingRequestTableRow({
  request,
  listingTitle,
  location,
  hostName,
  stayTotal,
  href,
}: TravelerPendingRequestTableRowProps) {
  const status = statusBadge(request);

  return (
    <tr className="group border-b border-sage-dark/20 last:border-b-0 hover:bg-sage/25">
      <td className="px-4 py-4 align-middle">
        <Link href={href} className="block min-w-0">
          <p className="font-semibold text-forest truncate group-hover:text-forest-light transition-colors">
            {listingTitle}
          </p>
          {hostName && (
            <p className="text-xs text-charcoal-light mt-0.5 truncate">{hostName}&apos;s family</p>
          )}
          <p className="text-[10px] font-mono text-charcoal-light/80 mt-0.5">
            Ref {formatBookingReference(request.id)}
          </p>
        </Link>
      </td>
      <td className="px-4 py-4 align-middle">
        <Link href={href} className="block text-sm text-charcoal whitespace-nowrap">
          {location ?? "—"}
        </Link>
      </td>
      <td className="px-4 py-4 align-middle">
        <Link href={href} className="block min-w-0">
          <p className="text-sm text-charcoal whitespace-nowrap">
            {formatDateRange(request.start_date, request.end_date)}
          </p>
          <p className="text-xs text-charcoal-light mt-0.5 whitespace-nowrap">
            {request.guest_count} guest{request.guest_count !== 1 ? "s" : ""}
          </p>
        </Link>
      </td>
      <td className="px-4 py-4 align-middle text-right">
        <Link href={href} className="block text-sm font-bold text-forest tabular-nums whitespace-nowrap">
          {stayTotal != null && stayTotal > 0 ? formatCurrency(stayTotal) : "—"}
        </Link>
      </td>
      <td className="px-4 py-4 align-middle">
        <Link href={href} className="flex items-center justify-end gap-2">
          <Badge variant={status.variant} className="whitespace-nowrap">
            {status.label}
          </Badge>
          <ChevronRight className="h-4 w-4 text-charcoal-light group-hover:text-forest shrink-0" />
        </Link>
      </td>
    </tr>
  );
}

export function TravelerPendingRequestListCard({
  request,
  listingTitle,
  location,
  hostName,
  stayTotal,
  href,
}: TravelerPendingRequestTableRowProps) {
  const status = statusBadge(request);

  return (
    <Link href={href} className="block group px-4 py-4 hover:bg-sage/25 transition-colors">
      <div className="space-y-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
            Family
          </p>
          <p className="font-semibold text-forest truncate">{listingTitle}</p>
          {hostName && <p className="text-xs text-charcoal-light mt-0.5">{hostName}&apos;s family</p>}
          {location && <p className="text-xs text-charcoal-light mt-0.5">{location}</p>}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
            Dates
          </p>
          <p className="text-sm text-charcoal">{formatDateRange(request.start_date, request.end_date)}</p>
          <p className="text-xs text-charcoal-light mt-0.5">
            {request.guest_count} guest{request.guest_count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
              Est. stay total
            </p>
            <p className="text-sm font-bold text-forest tabular-nums">
              {stayTotal != null && stayTotal > 0 ? formatCurrency(stayTotal) : "—"}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>
    </Link>
  );
}
