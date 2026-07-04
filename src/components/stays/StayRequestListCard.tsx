import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ListingMoneyOrDash } from "@/components/i18n/Money";
import { formatBookingReference, formatDateRange, STAY_REQUEST_STATUS_LABELS, type ListingPricing } from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import type { StayRequest } from "@/types/database";

interface StayRequestListCardProps {
  request: StayRequest;
  travelerName: string;
  guestProfileHref?: string;
  listingTitle: string;
  listingPricing: ListingPricing;
  incomeTotal: number | null;
  href: string;
}

export function StayRequestTableRow({
  request,
  travelerName,
  guestProfileHref,
  listingTitle,
  listingPricing,
  incomeTotal,
  href,
}: StayRequestListCardProps) {
  const status = STAY_REQUEST_STATUS_LABELS[request.status] ?? STAY_REQUEST_STATUS_LABELS.pending;

  return (
    <tr className="group border-b border-sage-dark/20 last:border-b-0 hover:bg-sage/25">
      <td className="px-4 py-4 align-middle">
        <div className="min-w-0">
          {guestProfileHref ? (
            <Link
              href={guestProfileHref}
              className="font-semibold text-forest truncate block hover:text-forest-light hover:underline transition-colors"
            >
              {travelerName}
            </Link>
          ) : (
            <p className="font-semibold text-forest truncate">{travelerName}</p>
          )}
          <Link href={href} className="block min-w-0 group/link">
            <p className="text-xs text-charcoal-light mt-0.5 truncate group-hover/link:text-charcoal transition-colors">
              {listingTitle}
            </p>
            <p className="text-[10px] font-mono text-charcoal-light/80 mt-0.5">
              Ref {formatBookingReference(request.id)}
            </p>
          </Link>
        </div>
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
          <ListingMoneyOrDash amount={incomeTotal} listing={listingPricing} />
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

export function StayRequestListCard({
  request,
  travelerName,
  guestProfileHref,
  listingTitle,
  listingPricing,
  incomeTotal,
  href,
}: StayRequestListCardProps) {
  const status = STAY_REQUEST_STATUS_LABELS[request.status] ?? STAY_REQUEST_STATUS_LABELS.pending;

  return (
    <div className="group px-4 py-4 hover:bg-sage/25 transition-colors sm:hidden">
      <div className="space-y-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
            Guest
          </p>
          {guestProfileHref ? (
            <Link
              href={guestProfileHref}
              className="font-semibold text-forest truncate block hover:text-forest-light hover:underline transition-colors"
            >
              {travelerName}
            </Link>
          ) : (
            <p className="font-semibold text-forest truncate">{travelerName}</p>
          )}
          <Link href={href} className="block min-w-0">
            <p className="text-xs text-charcoal-light mt-0.5 truncate">{listingTitle}</p>
            <p className="text-[10px] font-mono text-charcoal-light/80 mt-0.5">
              Ref {formatBookingReference(request.id)}
            </p>
          </Link>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
            Dates
          </p>
          <p className="text-sm text-charcoal">{formatDateRange(request.start_date, request.end_date)}</p>
          <p className="text-xs text-charcoal-light mt-0.5">
            {request.guest_count} guest{request.guest_count !== 1 ? "s" : ""}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide font-medium text-charcoal-light mb-0.5">
            Value
          </p>
          <p className="text-sm font-bold text-forest tabular-nums">
            <ListingMoneyOrDash amount={incomeTotal} listing={listingPricing} />
          </p>
        </div>

        <Link href={href} className="flex items-center justify-end gap-3">
          <Badge variant={status.variant}>{status.label}</Badge>
        </Link>
      </div>
    </div>
  );
}
