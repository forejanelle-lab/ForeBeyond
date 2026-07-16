import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { ExitIntentInterest } from "@/types/database";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXIT_INTENT_TAG = "Exit Intent Lead";
const VALID_INTERESTS = new Set<ExitIntentInterest>(["hosting", "traveling", "both"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    interest?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? "";
  const interest = body.interest?.trim() as ExitIntentInterest | undefined;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  if (!interest || !VALID_INTERESTS.has(interest)) {
    return NextResponse.json({ error: "Please select how you would like to stay connected." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.json({ error: "You are already part of the community." }, { status: 403 });
  }

  try {
    const service = createServiceClient();
    const { error } = await service.from("exit_intent_leads").upsert(
      {
        email,
        interest,
        tag: EXIT_INTENT_TAG,
      },
      { onConflict: "email" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save your email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
