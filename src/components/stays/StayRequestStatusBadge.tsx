import { Badge } from "@/components/ui/Badge";
import { STAY_REQUEST_STATUS_LABELS } from "@/lib/stay-requests";
import type { StayRequestStatus } from "@/types/database";

interface StayRequestStatusBadgeProps {
  status: StayRequestStatus;
}

export function StayRequestStatusBadge({ status }: StayRequestStatusBadgeProps) {
  const config = STAY_REQUEST_STATUS_LABELS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
