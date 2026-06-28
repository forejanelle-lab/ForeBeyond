import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/navigation-menu";
import { sendVerificationRejectionEmail } from "@/lib/send-verification-rejection-email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!isPlatformAdmin(user.email ?? "", adminProfile?.is_admin ?? false)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    userId?: string;
    userEmail?: string | null;
    userName?: string | null;
    documentType?: string;
    notes?: string | null;
  };

  if (!body.userId || !body.documentType) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let email = body.userEmail?.trim() ?? "";
  if (!email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", body.userId)
      .single();
    email = profile?.email?.trim() ?? "";
  }

  if (!email) {
    return NextResponse.json({ error: "Member email not found" }, { status: 400 });
  }

  const emailResult = await sendVerificationRejectionEmail({
    to: email,
    userName: body.userName,
    documentType: body.documentType,
    notes: body.notes,
  });

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    emailError: emailResult.error ?? null,
  });
}
