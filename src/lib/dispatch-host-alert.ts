import type { HostNotificationEvent } from "@/lib/send-host-notification-email";

export function dispatchHostAlert(payload: {
  event: HostNotificationEvent;
  stayRequestId?: string;
  conversationId?: string;
  messagePreview?: string | null;
}) {
  void fetch("/api/notifications/host-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
