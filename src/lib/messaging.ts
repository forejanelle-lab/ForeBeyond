import type { SupabaseClient } from "@supabase/supabase-js";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import type { MessageRead, StayMessage, StayRequest, StayRequestStatus, UserRole } from "@/types/database";

const HOST_MESSAGING_STATUSES: StayRequestStatus[] = ["pending", "host_approved", "approved"];
const TRAVELER_MESSAGING_STATUSES: StayRequestStatus[] = ["host_approved", "approved"];

export interface StayMessagingOptions {
  viewerIsHost?: boolean;
  hostHasMessaged?: boolean;
}

export function isStayMessagingOpen(
  request: Pick<StayRequest, "status" | "end_date"> | null | undefined,
  options?: StayMessagingOptions
): boolean {
  if (!request?.end_date) return false;
  if (request.end_date < todayIso()) return false;
  if (
    request.status === "rejected" ||
    request.status === "cancelled" ||
    request.status === "completed"
  ) {
    return false;
  }

  if (options?.viewerIsHost) {
    return HOST_MESSAGING_STATUSES.includes(request.status);
  }

  if (TRAVELER_MESSAGING_STATUSES.includes(request.status)) return true;
  if (request.status === "pending" && options?.hostHasMessaged) return true;
  return false;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatMessagingDisplayName(
  fullName: string | null | undefined,
  fallback = "Guest",
  options?: { stayStatus?: StayRequestStatus | null; revealFullName?: boolean }
): string {
  return formatMemberDisplayName(fullName, { fallback, ...options });
}

export function getMessagesInboxSubtitle(role: UserRole | null | undefined): string {
  if (role === "host") {
    return "Message guests about pending requests or confirmed stays.";
  }
  return "Chat with host families once they message you or approve your stay request.";
}

export function getMessagesEmptyStateDescription(role: UserRole | null | undefined): string {
  if (role === "host") {
    return "Open a pending request to ask questions before you approve, or message guests on confirmed stays.";
  }
  return "When a host messages you about a request, or approves your stay, the conversation will appear here.";
}

export function getStayMessagingLockReason(
  request: Pick<StayRequest, "status" | "end_date"> | null | undefined,
  options?: StayMessagingOptions
): string {
  if (isStayMessagingOpen(request, options)) {
    return "";
  }

  if (
    !request ||
    request.status === "rejected" ||
    request.status === "cancelled" ||
    request.status === "completed"
  ) {
    return "Messaging is not available for this stay request.";
  }

  if (request.end_date && request.end_date < todayIso()) {
    return "Messaging closed after your stay dates passed.";
  }

  if (!options?.viewerIsHost && request.status === "pending") {
    return "Messaging opens when the host messages you first or approves your stay request.";
  }

  return "Messaging is not available for this stay request.";
}

export async function hostHasMessagedStayRequest(
  supabase: SupabaseClient,
  stayRequestId: string,
  hostId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("stay_messages")
    .select("id", { count: "exact", head: true })
    .eq("stay_request_id", stayRequestId)
    .eq("sender_id", hostId);

  return (count ?? 0) > 0;
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

/** Creates (or returns) the conversation for an active stay request */
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
