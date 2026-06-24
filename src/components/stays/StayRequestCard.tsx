import Link from "next/link";
import { Calendar, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatDateRange } from "@/lib/stay-requests";
import { StayRequestStatusBadge } from "@/components/stays/StayRequestStatusBadge";
import type { StayRequest } from "@/types/database";

interface StayRequestCardProps {
  request: StayRequest;
  listingTitle?: string | null;
  otherPartyName?: string | null;
  href: string;
}

export function StayRequestCard({
  request,
  listingTitle,
  otherPartyName,
  href,
}: StayRequestCardProps) {
  return (
    <Link href={href} className="block group">
      <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StayRequestStatusBadge status={request.status} />
            <h3 className="font-semibold text-forest mt-2 truncate group-hover:text-forest-light">
              {listingTitle ?? "Stay request"}
            </h3>
            {otherPartyName && (
              <p className="text-sm text-charcoal-light mt-1">with {otherPartyName}</p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-charcoal-light mt-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDateRange(request.start_date, request.end_date)}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-charcoal-light mt-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {request.guest_count} guest{request.guest_count !== 1 ? "s" : ""}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-charcoal-light group-hover:text-forest shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  );
}
