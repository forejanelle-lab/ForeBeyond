import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import {
  HOST_PIPELINE_STATUSES,
  type HostPipelineStatus,
} from "@/lib/host-finder/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  pipelineStatus?: HostPipelineStatus;
  notes?: string;
  tags?: string[];
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { data: existing } = await auth.supabase
    .from("host_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.pipelineStatus !== undefined) {
    if (!HOST_PIPELINE_STATUSES.includes(body.pipelineStatus)) {
      return NextResponse.json({ error: "Invalid pipeline status." }, { status: 400 });
    }
    updates.pipeline_status = body.pipelineStatus;

    if (body.pipelineStatus !== existing.pipeline_status) {
      await auth.supabase.from("host_pipeline_events").insert({
        lead_id: id,
        from_status: existing.pipeline_status,
        to_status: body.pipelineStatus,
        created_by: auth.user.id,
      });
    }
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (body.tags !== undefined) {
    updates.tags = body.tags;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  const { data: updated, error } = await auth.supabase
    .from("host_leads")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: updated });
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let body: { action?: string; reason?: string };
  try {
    body = (await request.json()) as { action?: string; reason?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "dismiss") {
    const { data, error } = await auth.supabase
      .from("host_leads")
      .update({
        dismissed_at: new Date().toISOString(),
        dismissed_reason: body.reason?.trim() || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  }

  if (body.action === "add_to_pipeline") {
    const { data: existing } = await auth.supabase
      .from("host_leads")
      .select("pipeline_status")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    const newStatus = existing.pipeline_status === "new" ? "researching" : existing.pipeline_status;

    const { data, error } = await auth.supabase
      .from("host_leads")
      .update({ pipeline_status: newStatus })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (newStatus !== existing.pipeline_status) {
      await auth.supabase.from("host_pipeline_events").insert({
        lead_id: id,
        from_status: existing.pipeline_status,
        to_status: newStatus,
        note: "Added to host pipeline",
        created_by: auth.user.id,
      });
    }

    return NextResponse.json({ lead: data });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
