"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, CheckCheck, ImagePlus, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildReadMap,
  formatMessageTime,
  isMessageReadBy,
  markConversationRead,
} from "@/lib/messaging";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MessageRead, StayMessage } from "@/types/database";

interface ChatThreadProps {
  conversationId: string;
  stayRequestId: string;
  userId: string;
  otherPartyName: string;
  unlocked: boolean;
  compact?: boolean;
}

export function ChatThread({
  conversationId,
  stayRequestId,
  userId,
  otherPartyName,
  unlocked,
  compact = false,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<StayMessage[]>([]);
  const [reads, setReads] = useState<MessageRead[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const readMap = buildReadMap(reads);
  const otherUserIdRef = useRef<string | null>(null);

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

    if (typed.length > 0) {
      const { data: readRows } = await supabase
        .from("message_reads")
        .select("*")
        .in("message_id", typed.map((m) => m.id));
      setReads((readRows as MessageRead[]) ?? []);
      await markConversationRead(supabase, typed, userId);
    }
  }, [conversationId, userId]);

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
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await sendMessage({ body: body.trim(), messageType: "text" });
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setUploading(true);
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(path);
    await sendMessage({ attachmentUrl: urlData.publicUrl, messageType: "image" });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!unlocked) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">
          Messaging unlocks after the host approves your stay request.
        </p>
      </Card>
    );
  }

  const containerClass = compact
    ? "space-y-4"
    : "flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-10rem)] max-h-[720px]";

  return (
    <div className={containerClass}>
      {!compact && (
        <div className="shrink-0 border-b border-sage-dark/30 pb-3 mb-3">
          <h1 className="text-lg font-semibold text-forest">{otherPartyName}</h1>
          <p className="text-xs text-charcoal-light">Stay conversation · updates in real time</p>
        </div>
      )}

      {compact && (
        <div>
          <h3 className="font-semibold text-forest">Messages with {otherPartyName}</h3>
          <p className="text-sm text-charcoal-light mt-1">Real-time chat after approval</p>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto space-y-3 rounded-xl bg-sage/20 p-3 ${
          compact ? "max-h-72" : "min-h-0"
        }`}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-charcoal-light text-center py-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            const otherId = otherUserIdRef.current;
            const isRead = otherId
              ? isMessageReadBy(msg.id, otherId, readMap)
              : false;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] sm:max-w-[70%] ${
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
                  {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
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

      <form onSubmit={handleSend} className="shrink-0 space-y-2 pt-3 border-t border-sage-dark/20">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || isLoading}
            className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border border-sage-dark bg-white hover:bg-sage/40 transition-colors"
            aria-label="Upload image"
          >
            <ImagePlus className="h-5 w-5 text-forest" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            rows={1}
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl border border-sage-dark bg-white px-4 py-3 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
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
            isLoading={isLoading || uploading}
            className="shrink-0 h-11 w-11 !p-0 rounded-full"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
