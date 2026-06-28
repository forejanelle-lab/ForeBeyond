import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStayMessagingLockReason, isStayMessagingOpen, hostHasMessagedStayRequest, formatMessagingDisplayName } from "@/lib/messaging";
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

  const [{ data: otherProfile }, { data: currentProfile }, { data: stayRequest }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", otherId).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("stay_requests")
      .select("status, end_date")
      .eq("id", typedConversation.stay_request_id)
      .single(),
  ]);

  const stayRequestData = stayRequest as Pick<StayRequest, "status" | "end_date"> | null;
  const viewerIsHost = typedConversation.host_id === user.id;
  const hostHasMessaged =
    !viewerIsHost && stayRequestData?.status === "pending"
      ? await hostHasMessagedStayRequest(
          supabase,
          typedConversation.stay_request_id,
          typedConversation.host_id
        )
      : false;
  const unlocked = isStayMessagingOpen(stayRequestData, { viewerIsHost, hostHasMessaged });

  const otherName = formatMessagingDisplayName(
    (otherProfile as { full_name: string | null } | null)?.full_name,
    viewerIsHost ? "Guest" : "Host",
    { stayStatus: stayRequestData?.status ?? null }
  );
  const currentUserName = formatMessagingDisplayName(
    (currentProfile as { full_name: string | null } | null)?.full_name,
    "You",
    { revealFullName: true }
  );
  const lockReason = getStayMessagingLockReason(stayRequestData, { viewerIsHost, hostHasMessaged });

  return (
    <Container size="lg" className="py-4 md:py-6">
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
        currentUserName={currentUserName}
        unlocked={unlocked}
        lockReason={lockReason}
      />
    </Container>
  );
}
