import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { isStayMessagingOpen, todayIso } from "@/lib/messaging";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import type { StayRequest } from "@/types/database";

function getHostStayMessagingLockReason(
  request: Pick<StayRequest, "status" | "end_date"> | null | undefined
): string {
  if (isStayMessagingOpen(request)) return "";

  if (
    !request ||
    request.status === "pending" ||
    request.status === "rejected" ||
    request.status === "cancelled"
  ) {
    return "Messaging unlocks after you approve this stay request.";
  }

  if (request.end_date && request.end_date < todayIso()) {
    return "Messaging closed after the stay dates passed.";
  }

  return "Messaging is not available for this stay request.";
}

interface HostStayMessageButtonProps {
  request: Pick<StayRequest, "status" | "end_date">;
  conversationId: string | null;
  guestName: string;
}

export function HostStayMessageButton({
  request,
  conversationId,
  guestName,
}: HostStayMessageButtonProps) {
  const canMessage = isStayMessagingOpen(request) && Boolean(conversationId);
  const lockReason = getHostStayMessagingLockReason(request);
  const guestFirstName = guestName.split(" ")[0] || "guest";

  return (
    <Card variant="outline" padding="md" className="space-y-3">
      <div>
        <h3 className="font-semibold text-forest">Message guest</h3>
        <p className="text-sm text-charcoal-light mt-1">
          {canMessage
            ? `Chat with ${guestName} about arrival details and your stay.`
            : lockReason || "Messaging is not available for this request."}
        </p>
      </div>
      {canMessage && conversationId ? (
        <ButtonLink
          href={`/messages/${conversationId}`}
          variant="primary"
          size="md"
          className="w-full justify-center"
        >
          <MessageSquare className="h-4 w-4" />
          Message {guestFirstName}
        </ButtonLink>
      ) : (
        <span
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sage-dark/50 bg-sage/20 px-5 py-2.5 text-sm font-medium text-charcoal-light cursor-not-allowed"
          title={lockReason}
        >
          <MessageSquare className="h-4 w-4" />
          Message guest
        </span>
      )}
    </Card>
  );
}

/** Compact row action for tables — link when messaging is open */
export function HostStayMessageLink({
  request,
  conversationId,
}: Pick<HostStayMessageButtonProps, "request" | "conversationId">) {
  const canMessage = isStayMessagingOpen(request) && Boolean(conversationId);
  if (!canMessage || !conversationId) return null;

  return (
    <Link
      href={`/messages/${conversationId}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      Message
    </Link>
  );
}
