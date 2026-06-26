import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageRead, StayMessage, StayRequest, StayRequestStatus } from "@/types/database";

const MESSAGING_STATUSES: StayRequestStatus[] = ["host_approved", "approved"];

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isStayMessagingOpen(
  request: Pick<StayRequest, "status" | "end_date"> | null | undefined
): boolean {
  if (!request?.end_date) return false;
  if (!MESSAGING_STATUSES.includes(request.status)) return false;
  return request.end_date >= todayIso();
}

export function getStayMessagingLockReason(
  request: Pick<StayRequest, "status" | "end_date"> | null | undefined
): string {
  if (isStayMessagingOpen(request)) {
    return "";
  }

  if (
    !request ||
    request.status === "pending" ||
    request.status === "rejected" ||
    request.status === "cancelled"
  ) {
    return "Messaging unlocks after the host approves your stay request.";
  }

  if (request.end_date && request.end_date < todayIso()) {
    return "Messaging closed after your stay dates passed.";
  }

  return "Messaging is not available for this stay request.";
}

export function formatMessageTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(isThisYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
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

export function formatMessageListDate(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getOtherPartyId(
  conversation: { traveler_id: string; host_id: string },
  userId: string
) {
  return conversation.traveler_id === userId ? conversation.host_id : conversation.traveler_id;
}

/** Creates (or returns) the conversation once a host has approved the stay request */
export async function ensureStayConversation(
  supabase: SupabaseClient,
  stayRequestId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("ensure_stay_conversation", {
    p_stay_request_id: stayRequestId,
  });

  if (error || !data) return null;
  return data as string;
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
