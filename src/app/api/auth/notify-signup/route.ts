import { NextResponse } from "next/server";
import { sendNewAccountNotificationEmail } from "@/lib/send-new-account-notification-email";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    email?: string;
    fullName?: string;
  };

  const userId = body.userId?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const fullName = body.fullName?.trim() || null;

  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const emailResult = await sendNewAccountNotificationEmail({
    userId,
    email,
    fullName,
  });

  if (!emailResult.sent) {
    return NextResponse.json(
      { error: emailResult.error ?? "Failed to send notification" },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
