import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendHostNotificationEmail,
  type HostNotificationEvent,
} from "@/lib/send-host-notification-email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    event?: HostNotificationEvent;
    stayRequestId?: string;
    conversationId?: string;
    messagePreview?: string | null;
  };

  if (
    !body.event ||
    !["stay_request_submitted", "stay_dates_changed", "traveler_message"].includes(body.event)
  ) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  if (body.event === "traveler_message") {
    if (!body.conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, traveler_id, host_id, stay_request_id")
      .eq("id", body.conversationId)
      .single();

    if (!conversation || conversation.traveler_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [{ data: hostProfile }, { data: travelerProfile }, { data: stayRequest }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", conversation.host_id)
          .single(),
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase
          .from("stay_requests")
          .select("listing_id")
          .eq("id", conversation.stay_request_id)
          .single(),
      ]);

    const listing = stayRequest?.listing_id
      ? (
          await supabase
            .from("host_listings")
            .select("title")
            .eq("id", stayRequest.listing_id)
            .single()
        ).data
      : null;

    const hostEmail = hostProfile?.email?.trim();
    if (!hostEmail) {
      return NextResponse.json({ error: "Host email not found" }, { status: 400 });
    }

    const emailResult = await sendHostNotificationEmail({
      to: hostEmail,
      hostName: hostProfile?.full_name,
      event: "traveler_message",
      travelerName: travelerProfile?.full_name?.split(" ")[0] ?? null,
      listingTitle: listing?.title ?? null,
      messagePreview: body.messagePreview,
      actionPath: `/messages/${conversation.id}`,
    });

    return NextResponse.json({
      ok: true,
      emailSent: emailResult.sent,
      emailError: emailResult.error ?? null,
    });
  }

  if (!body.stayRequestId) {
    return NextResponse.json({ error: "stayRequestId required" }, { status: 400 });
  }

  const { data: stayRequest } = await supabase
    .from("stay_requests")
    .select("id, traveler_id, host_id, listing_id, start_date, end_date")
    .eq("id", body.stayRequestId)
    .single();

  if (!stayRequest || stayRequest.traveler_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ data: hostProfile }, { data: travelerProfile }, { data: listing }] = await Promise.all([
    supabase.from("profiles").select("email, full_name").eq("id", stayRequest.host_id).single(),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    stayRequest.listing_id
      ? supabase.from("host_listings").select("title").eq("id", stayRequest.listing_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const hostEmail = hostProfile?.email?.trim();
  if (!hostEmail) {
    return NextResponse.json({ error: "Host email not found" }, { status: 400 });
  }

  const emailResult = await sendHostNotificationEmail({
    to: hostEmail,
    hostName: hostProfile?.full_name,
    event: body.event,
    travelerName: travelerProfile?.full_name?.split(" ")[0] ?? null,
    listingTitle: listing?.title ?? null,
    startDate: stayRequest.start_date,
    endDate: stayRequest.end_date,
    actionPath: `/host/requests/${stayRequest.id}`,
  });

  return NextResponse.json({
    ok: true,
    emailSent: emailResult.sent,
    emailError: emailResult.error ?? null,
  });
}
