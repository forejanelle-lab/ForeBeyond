"use client";

import { ChatThread } from "@/components/messaging/ChatThread";

interface StayMessagingPanelProps {
  conversationId: string;
  stayRequestId: string;
  userId: string;
  otherPartyName: string;
  currentUserName?: string;
  unlocked: boolean;
  lockReason?: string;
}

export function StayMessagingPanel(props: StayMessagingPanelProps) {
  return <ChatThread {...props} compact />;
}
