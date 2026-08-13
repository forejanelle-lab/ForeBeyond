import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { withAccessibleSourcesForLeads } from "@/lib/host-finder/url-access";
import type { HostPipelineStatus } from "@/lib/host-finder/types";
import type { HostLeadSource } from "@/lib/host-finder/types";
import type { HostLead } from "@/lib/host-finder/types";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as HostPipelineStatus | null;
  const inPipeline = url.searchParams.get("inPipeline") === "true";

  let query = auth.supabase
    .from("host_leads")
    .select("*")
    .is("dismissed_at", null)
    .order("score", { ascending: false })
    .limit(500);

  if (status) {
    query = query.eq("pipeline_status", status);
  }

  if (inPipeline) {
    query = query.neq("pipeline_status", "new");
  }

  const { data: leads } = await query;

  if (!leads?.length) {
    return NextResponse.json({ leads: [] });
  }

  const leadIds = leads.map((l) => l.id);
  const { data: sources } = await auth.supabase
    .from("host_lead_sources")
    .select("*")
    .in("lead_id", leadIds);

  const sourcesByLead = new Map<string, HostLeadSource[]>();
  for (const src of (sources as HostLeadSource[]) ?? []) {
    const list = sourcesByLead.get(src.lead_id) ?? [];
    list.push(src);
    sourcesByLead.set(src.lead_id, list);
  }

  const leadsWithSources = await withAccessibleSourcesForLeads(
    (leads as HostLead[]).map((lead) => ({
      ...lead,
      sources: sourcesByLead.get(lead.id) ?? [],
    }))
  );

  return NextResponse.json({ leads: leadsWithSources });
}
