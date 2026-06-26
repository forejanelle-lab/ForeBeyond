import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStayMessagingLockReason, isStayMessagingOpen } from "@/lib/messaging";
import { ChatThread } from "@/components/messaging/ChatThread";
import { Container } from "@/components/ui/Container";
import type { Conversation, StayRequest } from "@/types/database";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/messages/${id}`);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`)
    .single();

  if (!conversation) notFound();

  const typedConversation = conversation as Conversation;
  const otherId =
    typedConversation.traveler_id === user.id
      ? typedConversation.host_id
      : typedConversation.traveler_id;

  const [{ data: otherProfile }, { data: stayRequest }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", otherId).single(),
    supabase
      .from("stay_requests")
      .select("status, end_date")
      .eq("id", typedConversation.stay_request_id)
      .single(),
  ]);

  const otherName =
    (otherProfile as { full_name: string | null } | null)?.full_name?.split(" ")[0] ?? "Guest";
  const stayRequestData = stayRequest as Pick<StayRequest, "status" | "end_date"> | null;
  const unlocked = isStayMessagingOpen(stayRequestData);
  const lockReason = getStayMessagingLockReason(stayRequestData);

  return (
    <Container className="py-4 md:py-6 max-w-2xl">
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        All conversations
      </Link>

      <ChatThread
        conversationId={typedConversation.id}
        stayRequestId={typedConversation.stay_request_id}
        userId={user.id}
        otherPartyName={otherName}
        unlocked={unlocked}
        lockReason={lockReason}
      />
    </Container>
  );
}
