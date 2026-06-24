import Link from "next/link";
import { formatConversationTime } from "@/lib/messaging";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Conversation } from "@/types/database";

interface ConversationListItemProps {
  conversation: Conversation;
  otherPartyName: string;
  listingTitle?: string | null;
  unreadCount?: number;
}

export function ConversationListItem({
  conversation,
  otherPartyName,
  listingTitle,
  unreadCount = 0,
}: ConversationListItemProps) {
  return (
    <Link href={`/messages/${conversation.id}`} className="block group">
      <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-forest truncate group-hover:text-forest-light">
                {otherPartyName}
              </h3>
              {unreadCount > 0 && (
                <Badge variant="gold">{unreadCount}</Badge>
              )}
            </div>
            {listingTitle && (
              <p className="text-xs text-charcoal-light mt-0.5 truncate">{listingTitle}</p>
            )}
            <p className="text-sm text-charcoal-light mt-1 truncate">
              {conversation.last_message_preview ?? "No messages yet"}
            </p>
          </div>
          {conversation.last_message_at && (
            <span className="text-xs text-charcoal-light shrink-0">
              {formatConversationTime(conversation.last_message_at)}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
