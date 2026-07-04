"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, CheckCheck, Search, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildReadMap,
  formatMessageTime,
  formatMessagingDisplayName,
  isMessageReadBy,
  markConversationRead,
} from "@/lib/messaging";
import { dispatchHostAlert } from "@/lib/dispatch-host-alert";
import { TranslatableText } from "@/components/i18n/TranslatableText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MessageRead, StayMessage } from "@/types/database";

interface ChatThreadProps {
  conversationId: string;
  stayRequestId: string;
  userId: string;
  otherPartyName: string;
  currentUserName?: string;
  unlocked: boolean;
  lockReason?: string;
  compact?: boolean;
}

export function ChatThread({
  conversationId,
  stayRequestId,
  userId,
  otherPartyName,
  currentUserName = "You",
  unlocked,
  lockReason = "Messaging is not available for this conversation yet.",
  compact = false,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<StayMessage[]>([]);
  const [reads, setReads] = useState<MessageRead[]>([]);
  const [body, setBody] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [error, setError] = useState("");
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readMap = buildReadMap(reads);
  const otherUserIdRef = useRef<string | null>(null);
  const hostIdRef = useRef<string | null>(null);

  const visibleMessages = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((msg) => msg.body?.toLowerCase().includes(q));
  }, [messages, messageSearch]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    const supabase = createClient();
    const { data: msgs } = await supabase
      .from("stay_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const typed = (msgs as StayMessage[]) ?? [];
    setMessages(typed);

    const senderIds = [...new Set(typed.map((m) => m.sender_id))];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      const nameMap: Record<string, string> = {
        [userId]: currentUserName,
      };
      for (const profile of profiles ?? []) {
        const row = profile as { id: string; full_name: string | null };
        nameMap[row.id] = formatMessagingDisplayName(
          row.full_name,
          row.id === userId ? currentUserName : otherPartyName
        );
      }
      setSenderNames(nameMap);
    } else {
      setSenderNames({ [userId]: currentUserName });
    }

    if (typed.length > 0) {
      const { data: readRows } = await supabase
        .from("message_reads")
        .select("*")
        .in("message_id", typed.map((m) => m.id));
      setReads((readRows as MessageRead[]) ?? []);
      await markConversationRead(supabase, typed, userId);
    }
  }, [conversationId, userId, currentUserName, otherPartyName]);

  useEffect(() => {
    if (!unlocked) return;
    loadMessages().then(scrollToBottom);
  }, [unlocked, loadMessages, scrollToBottom]);

  useEffect(() => {
    if (!unlocked) return;

    const supabase = createClient();

    supabase
      .from("conversations")
      .select("traveler_id, host_id")
      .eq("id", conversationId)
      .single()
      .then(({ data }) => {
        if (data) {
          hostIdRef.current = data.host_id;
          otherUserIdRef.current =
            data.traveler_id === userId ? data.host_id : data.traveler_id;
        }
      });

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stay_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as StayMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id !== userId) {
            markConversationRead(supabase, [msg], userId);
          }
          setTimeout(scrollToBottom, 50);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reads",
        },
        (payload) => {
          const read = payload.new as MessageRead;
          setReads((prev) => {
            if (prev.some((r) => r.id === read.id)) return prev;
            return [...prev, read];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, unlocked, userId, scrollToBottom]);

  async function sendMessage(payload: {
    body?: string;
    attachmentUrl?: string;
    messageType?: "text" | "image";
  }) {
    setIsLoading(true);
    setError("");
    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("stay_messages")
      .insert({
        stay_request_id: stayRequestId,
        conversation_id: conversationId,
        sender_id: userId,
        body: payload.body?.trim() || null,
        attachment_url: payload.attachmentUrl ?? null,
        message_type: payload.messageType ?? "text",
      })
      .select("*")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev;
      return [...prev, data as StayMessage];
    });
    setBody("");
    setIsLoading(false);
    scrollToBottom();

    if (hostIdRef.current && userId !== hostIdRef.current) {
      dispatchHostAlert({
        event: "traveler_message",
        conversationId,
        messagePreview:
          payload.messageType === "image"
            ? "Sent a photo"
            : payload.body?.trim() || null,
      });
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await sendMessage({ body: body.trim(), messageType: "text" });
  }

  if (!unlocked) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">{lockReason}</p>
      </Card>
    );
  }

  const containerClass = compact
    ? "space-y-4"
    : "flex flex-col h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-6.5rem)] min-h-[32rem]";

  return (
    <div className={containerClass}>
      {!compact && (
        <div className="shrink-0 border-b border-sage-dark/30 pb-4 mb-4 space-y-3">
          <div>
            <h1 className="text-xl font-semibold text-forest">{otherPartyName}</h1>
            <p className="text-sm text-charcoal-light">Stay conversation · updates in real time</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
            <input
              type="search"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search in this conversation..."
              className="w-full rounded-2xl border border-sage-dark bg-white py-3 pl-11 pr-10 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
            {messageSearch && (
              <button
                type="button"
                onClick={() => setMessageSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-forest"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {compact && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-forest">Messages with {otherPartyName}</h3>
            <p className="text-sm text-charcoal-light mt-1">Real-time chat</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
            <input
              type="search"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-xl border border-sage-dark bg-white py-2.5 pl-10 pr-9 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            />
            {messageSearch && (
              <button
                type="button"
                onClick={() => setMessageSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-light hover:text-forest"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto space-y-4 rounded-2xl border border-sage-dark/25 bg-sage/20 p-4 md:p-5 ${
          compact ? "min-h-[24rem] max-h-[min(40rem,70vh)]" : "min-h-0"
        }`}
      >
        {visibleMessages.length === 0 ? (
          <p className="text-sm text-charcoal-light text-center py-12">
            {messageSearch.trim()
              ? "No messages match your search."
              : "No messages yet. Say hello!"}
          </p>
        ) : (
          visibleMessages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            const otherId = otherUserIdRef.current;
            const isRead = otherId
              ? isMessageReadBy(msg.id, otherId, readMap)
              : false;
            const senderLabel =
              senderNames[msg.sender_id] ??
              (isOwn ? currentUserName : otherPartyName);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <p
                  className={`text-xs font-medium mb-1 px-1 ${
                    isOwn ? "text-charcoal-light" : "text-forest"
                  }`}
                >
                  {senderLabel}
                </p>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm max-w-[90%] sm:max-w-[75%] ${
                    isOwn
                      ? "bg-forest text-white rounded-br-md"
                      : "bg-white border border-sage-dark text-charcoal rounded-bl-md"
                  }`}
                >
                  {msg.message_type === "image" && msg.attachment_url && (
                    <div className="relative w-full max-w-[240px] aspect-[4/3] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={msg.attachment_url}
                        alt="Shared photo"
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    </div>
                  )}
                  {msg.body &&
                    (isOwn ? (
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    ) : (
                      <TranslatableText
                        text={msg.body}
                        className="whitespace-pre-wrap break-words [&>p]:whitespace-pre-wrap [&>p]:break-words"
                      />
                    ))}
                </div>
                <div
                  className={`flex items-center gap-1 mt-1 text-xs ${
                    isOwn ? "text-charcoal-light" : "text-charcoal-light"
                  }`}
                >
                  <span>{formatMessageTime(msg.created_at)}</span>
                  {isOwn && (
                    isRead ? (
                      <CheckCheck className="h-3.5 w-3.5 text-forest" aria-label="Read" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-label="Sent" />
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="shrink-0 space-y-2 pt-4 border-t border-sage-dark/20">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex items-end gap-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            rows={3}
            className="flex-1 min-h-[5.5rem] max-h-48 resize-y rounded-2xl border border-sage-dark bg-white px-4 py-3 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (body.trim()) handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="shrink-0 h-12 w-12 !p-0 rounded-full"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
