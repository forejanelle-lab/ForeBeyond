import { NextResponse } from "next/server";
import { syncSignupContactToBrevo } from "@/lib/brevo/sync-signup-contact";
import { sendNewAccountNotificationEmail } from "@/lib/send-new-account-notification-email";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserRole } from "@/types/database";

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
  let role: UserRole | null =
    roleRaw === "host" || roleRaw === "traveler"
      ? (roleRaw as UserRole)
      : null;
  let resolvedFullName = fullName;
  let isAdmin = false;
  const notifyAdmin = body.notifyAdmin !== false;

  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("full_name, role, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      isAdmin = profile.is_admin ?? false;
      if (profile.role === "host" || profile.role === "traveler") {
        role = profile.role;
      }
      if (!resolvedFullName && profile.full_name?.trim()) {
        resolvedFullName = profile.full_name.trim();
      }
    }
  } catch {
    // Fall back to request body when service role is unavailable locally.
  }

  const brevoResult = await syncSignupContactToBrevo({
    userId,
    email,
    fullName: resolvedFullName,
    firstName,
    lastName,
    role,
    isAdmin,
  });

  let adminEmailSent = false;
  let adminEmailError: string | null = null;

  if (notifyAdmin) {
    const adminEmailResult = await sendNewAccountNotificationEmail({
      userId,
      email,
      fullName: resolvedFullName,
      role,
    });
    adminEmailSent = adminEmailResult.sent;
    adminEmailError = adminEmailResult.error ?? null;
  }

  if (!brevoResult.synced) {
    console.error("notify-signup Brevo sync failed:", brevoResult.error);
  }

  if (notifyAdmin && !adminEmailSent) {
    console.error("notify-signup admin email failed:", adminEmailError);
  }

  return NextResponse.json({
    ok: true,
    brevo: { synced: brevoResult.synced, error: brevoResult.error ?? null },
    adminEmail: notifyAdmin
      ? { sent: adminEmailSent, error: adminEmailError }
      : { sent: false, skipped: true },
  });
}
