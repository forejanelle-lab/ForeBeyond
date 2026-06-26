"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Conversation } from "@/types/database";

export interface InboxConversationRow {
  conversation: Conversation;
  otherPartyName: string;
  listingTitle: string | null;
  unreadCount: number;
}

interface MessagesInboxListProps {
  conversations: InboxConversationRow[];
}

type SortOption = "newest" | "oldest";
type FilterOption = "all" | "unread";

function conversationTimestamp(conversation: Conversation) {
  return new Date(conversation.last_message_at ?? conversation.created_at).getTime();
}

export function MessagesInboxList({ conversations }: MessagesInboxListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filter, setFilter] = useState<FilterOption>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = conversations.filter((row) => {
      if (filter === "unread" && row.unreadCount === 0) return false;
      if (!q) return true;
      return `${row.otherPartyName} ${row.listingTitle ?? ""} ${row.conversation.last_message_preview ?? ""}`
        .toLowerCase()
        .includes(q);
    });

    rows = [...rows].sort((a, b) => {
      const ta = conversationTimestamp(a.conversation);
      const tb = conversationTimestamp(b.conversation);
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    return rows;
  }, [conversations, query, sort, filter]);

  if (conversations.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-16">
        <MessageCircle className="h-10 w-10 text-forest mx-auto mb-4" />
        <p className="text-charcoal-light mb-2">No conversations yet.</p>
        <p className="text-sm text-charcoal-light mb-6 max-w-md mx-auto">
          Once a stay is approved, you can message your host or traveler here.
        </p>
        <Link href="/search" className="text-sm font-medium text-forest hover:underline">
          Browse families
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or listing..."
            className="pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm"
        >
          <option value="all">All messages</option>
          <option value="unread">Unread only</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-charcoal-light text-center py-10">
          No conversations match your filters.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <ConversationListItem key={row.conversation.id} {...row} />
          ))}
        </div>
      )}
    </div>
  );
}
