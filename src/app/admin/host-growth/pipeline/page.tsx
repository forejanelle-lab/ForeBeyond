import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HostPipelinePanel } from "@/components/admin/host-finder/HostPipelinePanel";
import { HostFinderSetupBanner } from "@/components/admin/host-finder/HostFinderSetupBanner";
import { isHostFinderSchemaReady } from "@/lib/host-finder/schema-ready";
import { withAccessibleSourcesForLeads } from "@/lib/host-finder/url-access";
import type { HostLead, HostLeadSource, HostLeadWithSources } from "@/lib/host-finder/types";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Host Pipeline",
  description: "Track and manage potential host leads through your acquisition pipeline.",
  path: "/admin/host-growth/pipeline",
});

export default async function HostPipelinePage() {
  const supabase = await createClient();
  const schemaReady = await isHostFinderSchemaReady(supabase);

  let leadsWithSources: HostLeadWithSources[] = [];

  if (schemaReady) {
    const { data: leads } = await supabase
      .from("host_leads")
      .select("*")
      .is("dismissed_at", null)
      .neq("pipeline_status", "new")
      .order("score", { ascending: false })
      .limit(500);

    const leadRows = (leads as HostLead[]) ?? [];
    const leadIds = leadRows.map((l) => l.id);

    const sourcesByLead = new Map<string, HostLeadSource[]>();
    if (leadIds.length > 0) {
      const { data: sources } = await supabase
        .from("host_lead_sources")
        .select("*")
        .in("lead_id", leadIds);

      for (const src of (sources as HostLeadSource[]) ?? []) {
        const list = sourcesByLead.get(src.lead_id) ?? [];
        list.push(src);
        sourcesByLead.set(src.lead_id, list);
      }
    }

    leadsWithSources = await withAccessibleSourcesForLeads(
      leadRows.map((lead) => ({
        ...lead,
        sources: sourcesByLead.get(lead.id) ?? [],
      }))
    );
  }

  return (
    <AdminShell
      wide
      title="Host Pipeline"
      description="Track outreach progress from discovery to signed-up host."
    >
      {!schemaReady ? (
        <HostFinderSetupBanner />
      ) : (
        <HostPipelinePanel initialLeads={leadsWithSources} />
      )}
    </AdminShell>
  );
}
