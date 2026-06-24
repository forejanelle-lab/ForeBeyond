import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageRead, StayMessage } from "@/types/database";

export function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatConversationTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getOtherPartyId(
  conversation: { traveler_id: string; host_id: string },
  userId: string
) {
  return conversation.traveler_id === userId ? conversation.host_id : conversation.traveler_id;
}

export async function markConversationRead(
  supabase: SupabaseClient,
  messages: StayMessage[],
  userId: string
) {
  const unread = messages.filter((m) => m.sender_id !== userId);
  for (const message of unread) {
    await supabase.from("message_reads").upsert(
      { message_id: message.id, user_id: userId },
      { onConflict: "message_id,user_id", ignoreDuplicates: true }
    );
  }
}

export function buildReadMap(reads: MessageRead[]) {
  const map: Record<string, MessageRead[]> = {};
  reads.forEach((read) => {
    if (!map[read.message_id]) map[read.message_id] = [];
    map[read.message_id].push(read);
  });
  return map;
}

export function isMessageReadBy(
  messageId: string,
  userId: string,
  readMap: Record<string, MessageRead[]>
) {
  return readMap[messageId]?.some((r) => r.user_id === userId) ?? false;
}
