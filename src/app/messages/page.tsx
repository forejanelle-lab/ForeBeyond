import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  MessagesInboxList,
  type InboxConversationRow,
} from "@/components/messaging/MessagesInboxList";
import { getMessagesInboxSubtitle, formatMessagingDisplayName } from "@/lib/messaging";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import type { AppNotification, Conversation, Profile, PublicListing, StayRequestStatus } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Messages",
  description: "Your conversations with hosts and travelers on Fore Beyond.",
  path: "/messages",
});

export default async function MessagesInboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const viewerRole = (profile as Pick<Profile, "role"> | null)?.role ?? null;

  const typedConversations = (conversations as Conversation[]) ?? [];
  const otherIds = typedConversations.map((c) =>
    c.traveler_id === user.id ? c.host_id : c.traveler_id
  );
  const listingIds = [...new Set(typedConversations.map((c) => c.stay_request_id))];

  const [{ data: profiles }, { data: stayRequests }, { data: notifs }] = await Promise.all([
    otherIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    listingIds.length > 0
      ? supabase.from("stay_requests").select("id, listing_id, status").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("notifications")
      .select("metadata, read_at")
      .eq("user_id", user.id)
      .eq("type", "new_message")
      .is("read_at", null),
  ]);

  const requestStatusMap = Object.fromEntries(
    ((stayRequests as { id: string; status: StayRequestStatus }[]) ?? []).map(
      (r) => [r.id, r.status]
    )
  );

  const profileMap = Object.fromEntries(
    ((profiles as { id: string; full_name: string | null }[]) ?? []).map((p) => [p.id, p.full_name])
  );

  const requestListingMap = Object.fromEntries(
    ((stayRequests as { id: string; listing_id: string | null }[]) ?? []).map((r) => [
      r.id,
      r.listing_id,
    ])
  );

  const listingIdList = [...new Set(Object.values(requestListingMap).filter(Boolean) as string[])];

  let listingMap: Record<string, string> = {};
  if (listingIdList.length > 0) {
    const { data: listings } = await supabase
      .from("public_listings")
      .select("id, title")
      .in("id", listingIdList);
    listingMap = Object.fromEntries(
      ((listings as Pick<PublicListing, "id" | "title">[]) ?? []).map((l) => [
        l.id,
        l.title ?? "Stay",
      ])
    );
  }

  const unreadByConversation: Record<string, number> = {};
  ((notifs as Pick<AppNotification, "metadata" | "read_at">[]) ?? []).forEach((n) => {
    const convId = n.metadata?.conversation_id as string | undefined;
    if (convId) unreadByConversation[convId] = (unreadByConversation[convId] ?? 0) + 1;
  });

  const inboxRows: InboxConversationRow[] = typedConversations.map((conversation) => {
    const otherId =
      conversation.traveler_id === user.id ? conversation.host_id : conversation.traveler_id;
    const listingId = requestListingMap[conversation.stay_request_id];
    const stayStatus = requestStatusMap[conversation.stay_request_id] ?? null;
    return {
      conversation,
      otherPartyName: formatMessagingDisplayName(profileMap[otherId], "Guest", { stayStatus }),
      listingTitle: listingId ? listingMap[listingId] : null,
      unreadCount: unreadByConversation[conversation.id] ?? 0,
    };
  });

  const unreadTotal = inboxRows.reduce((sum, row) => sum + row.unreadCount, 0);

  return (
    <>
      <div className="border-b border-sage-dark/20 bg-white">
        <Container className="py-8 md:py-10">
          <Badge variant="gold" className="mb-3">
            <MessageCircle className="h-3 w-3" />
            Messages
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-forest">Your conversations</h1>
          <p className="mt-2 text-sm text-charcoal-light max-w-2xl">
            {getMessagesInboxSubtitle(viewerRole)}
          </p>
          <p className="mt-1 text-sm text-charcoal-light">
            {typedConversations.length} conversation{typedConversations.length !== 1 ? "s" : ""}
            {unreadTotal > 0 && ` · ${unreadTotal} unread`}
          </p>
        </Container>
      </div>

      <Container size="xl" className="py-8 md:py-10">
        <MessagesInboxList conversations={inboxRows} viewerRole={viewerRole} />
      </Container>
    </>
  );
}
