import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import type { AppNotification, Conversation, PublicListing } from "@/types/database";

export const metadata = { title: "Messages" };

export default async function MessagesInboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const typedConversations = (conversations as Conversation[]) ?? [];
  const otherIds = typedConversations.map((c) =>
    c.traveler_id === user.id ? c.host_id : c.traveler_id
  );
  const listingIds = [...new Set(
    typedConversations
      .map((c) => c.stay_request_id)
  )];

  const [{ data: profiles }, { data: stayRequests }, { data: notifs }] = await Promise.all([
    otherIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", otherIds)
      : Promise.resolve({ data: [] }),
    listingIds.length > 0
      ? supabase.from("stay_requests").select("id, listing_id").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from("notifications")
      .select("metadata, read_at")
      .eq("user_id", user.id)
      .eq("type", "new_message")
      .is("read_at", null),
  ]);

  const profileMap = Object.fromEntries(
    ((profiles as { id: string; full_name: string | null }[]) ?? []).map((p) => [
      p.id,
      p.full_name?.split(" ")[0] ?? "Guest",
    ])
  );

  const requestListingMap = Object.fromEntries(
    ((stayRequests as { id: string; listing_id: string | null }[]) ?? []).map((r) => [r.id, r.listing_id])
  );

  const listingIdList = [...new Set(
    Object.values(requestListingMap).filter(Boolean) as string[]
  )];

  let listingMap: Record<string, string> = {};
  if (listingIdList.length > 0) {
    const { data: listings } = await supabase
      .from("public_listings")
      .select("id, title")
      .in("id", listingIdList);
    listingMap = Object.fromEntries(
      ((listings as Pick<PublicListing, "id" | "title">[]) ?? []).map((l) => [l.id, l.title ?? "Stay"])
    );
  }

  const unreadByConversation: Record<string, number> = {};
  ((notifs as Pick<AppNotification, "metadata" | "read_at">[]) ?? []).forEach((n) => {
    const convId = n.metadata?.conversation_id as string | undefined;
    if (convId) unreadByConversation[convId] = (unreadByConversation[convId] ?? 0) + 1;
  });

  return (
    <Container className="py-6 md:py-10 max-w-2xl">
      <div className="mb-6">
        <Badge variant="gold" className="mb-3">
          <MessageCircle className="h-3 w-3" />
          Messages
        </Badge>
        <h1 className="text-2xl md:text-3xl font-bold text-forest">Conversations</h1>
        <p className="mt-1 text-sm text-charcoal-light">
          Chat unlocks after a stay request is approved
        </p>
      </div>

      {typedConversations.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <MessageCircle className="h-10 w-10 text-forest mx-auto mb-4" />
          <p className="text-charcoal-light mb-4">No conversations yet.</p>
          <p className="text-sm text-charcoal-light mb-4">
            Once a stay is approved, you can message your host or traveler here.
          </p>
          <Link href="/search" className="text-sm font-medium text-forest hover:underline">
            Browse families
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {typedConversations.map((conversation) => {
            const otherId = conversation.traveler_id === user.id
              ? conversation.host_id
              : conversation.traveler_id;
            const listingId = requestListingMap[conversation.stay_request_id];
            return (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                otherPartyName={profileMap[otherId] ?? "Guest"}
                listingTitle={listingId ? listingMap[listingId] : null}
                unreadCount={unreadByConversation[conversation.id] ?? 0}
              />
            );
          })}
        </div>
      )}
    </Container>
  );
}
