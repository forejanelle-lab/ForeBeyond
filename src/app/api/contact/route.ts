import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/send-contact-email";
import { createClient } from "@/lib/supabase/server";
import { PARTNERSHIP_EMAIL } from "@/lib/email-config";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    name?: string;
    email?: string;
    inbox?: "default" | "partnership";
  };

  const message = body.message?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";

  if (message.length < 10) {
    return NextResponse.json(
      { error: "Please enter at least 10 characters describing how we can help." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userFullName = name;
  let userEmail = email;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    userFullName = profile?.full_name?.trim() || name || "Member";
    userEmail = profile?.email?.trim() || user.email?.trim() || email;

    const { error: insertError } = await supabase.from("support_requests").insert({
      user_id: user.id,
      user_full_name: userFullName,
      user_email: userEmail,
      message,
      status: "open",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    if (!userFullName) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
    }
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
  }

  const emailResult = await sendContactEmail({
    fromName: userFullName,
    fromEmail: userEmail,
    message,
    to: body.inbox === "partnership" ? PARTNERSHIP_EMAIL : undefined,
    subjectPrefix: body.inbox === "partnership" ? "Partnership inquiry" : undefined,
  });

  if (!emailResult.sent) {
    return NextResponse.json(
      {
        error:
          user != null
            ? "Your message was saved, but we could not send the email notification. Please try again or email us directly."
            : "We could not send your message right now. Please try again or email hello@forebeyond.com directly.",
        emailError: emailResult.error ?? null,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, emailSent: true });
}
