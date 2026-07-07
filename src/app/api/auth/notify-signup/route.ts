import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNewAccountNotificationEmail } from "@/lib/send-new-account-notification-email";

const MAX_AGE_MS = 15 * 60 * 1000;

async function getSignupUser(service: ReturnType<typeof createServiceClient>, userId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (!error && data.user) {
      return data.user;
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const userId = body.userId?.trim();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const user = await getSignupUser(service, userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const createdAt = new Date(user.created_at).getTime();
    if (Number.isNaN(createdAt) || Date.now() - createdAt > MAX_AGE_MS) {
      return NextResponse.json({ error: "Signup notification window expired" }, { status: 403 });
    }

    const metadata = user.user_metadata as {
      full_name?: string;
      first_name?: string;
      last_name?: string;
    };
    const fullName =
      metadata.full_name?.trim() ||
      [metadata.first_name, metadata.last_name].filter(Boolean).join(" ").trim() ||
      null;

    const emailResult = await sendNewAccountNotificationEmail({
      userId: user.id,
      email: user.email ?? "unknown",
      fullName,
    });

    if (!emailResult.sent) {
      return NextResponse.json(
        { error: emailResult.error ?? "Failed to send notification" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send signup notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
