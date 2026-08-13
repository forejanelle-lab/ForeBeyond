import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { generateOutreachMessage } from "@/lib/host-finder/outreach";
import type { HostLead, HostLeadSource } from "@/lib/host-finder/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required for outreach generation." },
      { status: 503 }
    );
  }

  const { id } = await params;

  const { data: lead } = await auth.supabase
    .from("host_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const { data: sources } = await auth.supabase
    .from("host_lead_sources")
    .select("*")
    .eq("lead_id", id);

  try {
    const message = await generateOutreachMessage(
      lead as HostLead,
      (sources as HostLeadSource[]) ?? []
    );

    await auth.supabase
      .from("host_leads")
      .update({ outreach_draft: message })
      .eq("id", id);

    return NextResponse.json({ message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Outreach generation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let body: { message?: string };
  try {
    body = (await request.json()) as { message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("host_leads")
    .update({ outreach_draft: body.message ?? "" })
    .eq("id", id)
    .select("outreach_draft")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data?.outreach_draft ?? "" });
}
