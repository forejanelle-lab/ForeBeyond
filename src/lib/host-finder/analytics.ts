import type { SupabaseClient } from "@supabase/supabase-js";
import type { HostLead, HostLeadSource, HostLeadSourceType } from "@/lib/host-finder/types";

export interface HostFinderAnalytics {
  totals: {
    discovered: number;
    highPriority: number;
    contacted: number;
    interested: number;
    applicationStarted: number;
    verified: number;
    signedUp: number;
    conversionRate: number;
  };
  bySource: { source: HostLeadSourceType; count: number; verified: number; signedUp: number }[];
  byCountry: { country: string; count: number; highPriority: number }[];
  byRegion: { region: string; country: string; count: number }[];
  byHostType: { hostType: string; count: number }[];
  bySearch: {
    searchId: string;
    country: string;
    region: string | null;
    leadsFound: number;
    highPriority: number;
    createdAt: string;
  }[];
  byDate: { date: string; discovered: number; highPriority: number }[];
}

const CONTACTED_STATUSES = new Set([
  "contacted",
  "follow_up_due",
  "replied",
  "interested",
  "application_started",
  "verified",
  "signed_up",
]);

export async function computeHostFinderAnalytics(
  supabase: SupabaseClient
): Promise<HostFinderAnalytics> {
  const { data: leads } = await supabase
    .from("host_leads")
    .select("*")
    .is("dismissed_at", null);

  const allLeads = (leads as HostLead[]) ?? [];

  const { data: sources } = await supabase.from("host_lead_sources").select("*");
  const allSources = (sources as HostLeadSource[]) ?? [];

  const { data: searches } = await supabase
    .from("host_searches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const discovered = allLeads.length;
  const highPriority = allLeads.filter((l) => l.priority === "high_priority").length;
  const contacted = allLeads.filter((l) => CONTACTED_STATUSES.has(l.pipeline_status)).length;
  const interested = allLeads.filter((l) =>
    ["interested", "application_started", "verified", "signed_up"].includes(l.pipeline_status)
  ).length;
  const applicationStarted = allLeads.filter((l) =>
    ["application_started", "verified", "signed_up"].includes(l.pipeline_status)
  ).length;
  const verified = allLeads.filter((l) =>
    ["verified", "signed_up"].includes(l.pipeline_status)
  ).length;
  const signedUp = allLeads.filter((l) => l.pipeline_status === "signed_up").length;
  const conversionRate = discovered > 0 ? Math.round((signedUp / discovered) * 1000) / 10 : 0;

  const leadById = new Map(allLeads.map((l) => [l.id, l]));

  const sourceCounts = new Map<
    HostLeadSourceType,
    { count: number; verified: number; signedUp: number }
  >();

  for (const src of allSources) {
    const lead = leadById.get(src.lead_id);
    if (!lead) continue;
    const entry = sourceCounts.get(src.source_type) ?? { count: 0, verified: 0, signedUp: 0 };
    entry.count += 1;
    if (["verified", "signed_up"].includes(lead.pipeline_status)) entry.verified += 1;
    if (lead.pipeline_status === "signed_up") entry.signedUp += 1;
    sourceCounts.set(src.source_type, entry);
  }

  const countryCounts = new Map<string, { count: number; highPriority: number }>();
  for (const lead of allLeads) {
    const country = lead.country ?? "Unknown";
    const entry = countryCounts.get(country) ?? { count: 0, highPriority: 0 };
    entry.count += 1;
    if (lead.priority === "high_priority") entry.highPriority += 1;
    countryCounts.set(country, entry);
  }

  const regionCounts = new Map<string, { country: string; count: number }>();
  for (const lead of allLeads) {
    if (!lead.region) continue;
    const key = `${lead.region}|${lead.country ?? "Unknown"}`;
    const entry = regionCounts.get(key) ?? { country: lead.country ?? "Unknown", count: 0 };
    entry.count += 1;
    regionCounts.set(key, entry);
  }

  const hostTypeCounts = new Map<string, number>();
  for (const lead of allLeads) {
    const type = lead.host_type ?? "unknown";
    hostTypeCounts.set(type, (hostTypeCounts.get(type) ?? 0) + 1);
  }

  const dateCounts = new Map<string, { discovered: number; highPriority: number }>();
  for (const lead of allLeads) {
    const date = lead.discovered_at.slice(0, 10);
    const entry = dateCounts.get(date) ?? { discovered: 0, highPriority: 0 };
    entry.discovered += 1;
    if (lead.priority === "high_priority") entry.highPriority += 1;
    dateCounts.set(date, entry);
  }

  return {
    totals: {
      discovered,
      highPriority,
      contacted,
      interested,
      applicationStarted,
      verified,
      signedUp,
      conversionRate,
    },
    bySource: Array.from(sourceCounts.entries())
      .map(([source, stats]) => ({ source, ...stats }))
      .sort((a, b) => b.count - a.count),
    byCountry: Array.from(countryCounts.entries())
      .map(([country, stats]) => ({ country, ...stats }))
      .sort((a, b) => b.count - a.count),
    byRegion: Array.from(regionCounts.entries())
      .map(([key, stats]) => ({
        region: key.split("|")[0]!,
        country: stats.country,
        count: stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    byHostType: Array.from(hostTypeCounts.entries())
      .map(([hostType, count]) => ({ hostType, count }))
      .sort((a, b) => b.count - a.count),
    bySearch: ((searches ?? []) as { id: string; country: string; region: string | null; leads_found: number; high_priority_count: number; created_at: string }[]).map(
      (s) => ({
        searchId: s.id,
        country: s.country,
        region: s.region,
        leadsFound: s.leads_found,
        highPriority: s.high_priority_count,
        createdAt: s.created_at,
      })
    ),
    byDate: Array.from(dateCounts.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30),
  };
}
