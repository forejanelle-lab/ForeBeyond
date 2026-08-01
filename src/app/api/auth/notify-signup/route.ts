import { NextResponse } from "next/server";
import { syncSignupContactToBrevo } from "@/lib/brevo/sync-signup-contact";
import { sendNewAccountNotificationEmail } from "@/lib/send-new-account-notification-email";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    email?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    notifyAdmin?: boolean;
  };

  const userId = body.userId?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const fullName = body.fullName?.trim() || null;
  const firstName = body.firstName?.trim() || null;
  const lastName = body.lastName?.trim() || null;
  const roleRaw = body.role?.trim().toLowerCase();
  const role =
    roleRaw === "host" || roleRaw === "traveler"
      ? (roleRaw as "host" | "traveler")
      : null;
  const notifyAdmin = body.notifyAdmin !== false;

  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const brevoResult = await syncSignupContactToBrevo({
    userId,
    email,
    fullName,
    firstName,
    lastName,
    role,
  });

  if (!brevoResult.synced) {
    return NextResponse.json(
      { error: brevoResult.error ?? "Failed to sync signup to Brevo" },
      { status: 503 }
    );
  }

  if (notifyAdmin) {
    void sendNewAccountNotificationEmail({
      userId,
      email,
      fullName,
    });
  }

  return NextResponse.json({ ok: true });
}
