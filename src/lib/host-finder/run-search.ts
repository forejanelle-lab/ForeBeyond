import type { SupabaseClient } from "@supabase/supabase-js";
import { createSearchProvider } from "@/lib/host-finder/providers";
import { buildSearchTerms, DEFAULT_SIGNALS, type SignalPhrase } from "@/lib/host-finder/signals";
import { qualifySearchResults } from "@/lib/host-finder/qualify";
import { buildDedupKey, mergeTags, pickBetterScore } from "@/lib/host-finder/dedup";
import {
  filterAccessibleSearchResults,
  filterAccessibleSources,
  isSourceUrlAccessible,
  withAccessibleSourcesForLeads,
} from "@/lib/host-finder/url-access";
import type {
  HostFinderHostType,
  HostLead,
  HostLeadSource,
  HostLeadWithSources,
  HostSearch,
} from "@/lib/host-finder/types";

export interface RunHostSearchInput {
  country: string;
  region?: string;
  hostType: HostFinderHostType;
  leadsRequested: number;
  createdBy: string;
}

export interface RunHostSearchResult {
  search: HostSearch;
  leads: HostLeadWithSources[];
}

async function loadActiveSignals(supabase: SupabaseClient): Promise<SignalPhrase[]> {
  const { data } = await supabase
    .from("host_signal_library")
    .select("phrase, intent_level, category")
    .eq("active", true);

  if (!data?.length) return DEFAULT_SIGNALS;

  return data as SignalPhrase[];
}

export async function runHostSearch(
  supabase: SupabaseClient,
  input: RunHostSearchInput
): Promise<RunHostSearchResult> {
  const { country, region, hostType, leadsRequested, createdBy } = input;

  const { data: searchRow, error: searchError } = await supabase
    .from("host_searches")
    .insert({
      created_by: createdBy,
      country,
      region: region?.trim() || null,
      host_type: hostType,
      leads_requested: leadsRequested,
      status: "running",
    })
    .select("*")
    .single();

  if (searchError || !searchRow) {
    throw new Error(searchError?.message ?? "Failed to create search record.");
  }

  const search = searchRow as HostSearch;

  try {
    const signals = await loadActiveSignals(supabase);
    const searchTerms = buildSearchTerms(signals, hostType);
    const provider = createSearchProvider();

    const rawResults = await provider.search(
      { country, region, hostType, leadsRequested },
      searchTerms
    );

    const accessibleResults = await filterAccessibleSearchResults(
      rawResults.slice(0, Math.min(leadsRequested * 2, 40))
    );

    const qualified = await qualifySearchResults(
      accessibleResults,
      country,
      region,
      hostType
    );

    const legitimate = qualified
      .filter((q) => q.qualification.isLegitimateLead)
      .sort((a, b) => b.qualification.score - a.qualification.score)
      .slice(0, leadsRequested);

    const leads: HostLeadWithSources[] = [];

    for (const { result, qualification } of legitimate) {
      const dedupKey = buildDedupKey(result, qualification);

      const { data: existingLead } = await supabase
        .from("host_leads")
        .select("*")
        .eq("dedup_key", dedupKey)
        .maybeSingle();

      let lead: HostLead;

      if (existingLead) {
        const existing = existingLead as HostLead;
        const newScore = pickBetterScore(existing.score, qualification.score);

        const { data: updated, error: updateError } = await supabase
          .from("host_leads")
          .update({
            score: newScore,
            priority: qualification.priority,
            evidence_excerpt: qualification.evidenceExcerpt,
            why_good_fit: mergeTags(existing.why_good_fit, qualification.whyGoodFit),
            host_experience: qualification.hostExperience ?? existing.host_experience,
            potential_concerns: mergeTags(
              existing.potential_concerns,
              qualification.potentialConcerns
            ),
            recommended_approach:
              qualification.recommendedApproach ?? existing.recommended_approach,
            score_explanation: qualification.scoreExplanation,
            tags: mergeTags(existing.tags, qualification.suggestedTags),
            country: qualification.country ?? existing.country,
            region: qualification.region ?? existing.region,
            email: qualification.email ?? existing.email,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateError || !updated) continue;
        lead = updated as HostLead;

        await supabase.from("host_lead_scores").insert({
          lead_id: lead.id,
          score: qualification.score,
          priority: qualification.priority,
          explanation: qualification.scoreExplanation,
          model: "gpt-4o-mini",
        });
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("host_leads")
          .insert({
            search_id: search.id,
            name: qualification.name,
            email: qualification.email,
            country: qualification.country ?? country,
            region: qualification.region ?? region ?? null,
            score: qualification.score,
            priority: qualification.priority,
            host_type: hostType,
            evidence_excerpt: qualification.evidenceExcerpt,
            why_good_fit: qualification.whyGoodFit,
            host_experience: qualification.hostExperience,
            potential_concerns: qualification.potentialConcerns,
            recommended_approach: qualification.recommendedApproach,
            score_explanation: qualification.scoreExplanation,
            tags: qualification.suggestedTags,
            dedup_key: dedupKey,
          })
          .select("*")
          .single();

        if (insertError || !inserted) continue;
        lead = inserted as HostLead;

        await supabase.from("host_lead_scores").insert({
          lead_id: lead.id,
          score: qualification.score,
          priority: qualification.priority,
          explanation: qualification.scoreExplanation,
          model: "gpt-4o-mini",
        });
      }

      const normalizedUrl = result.url.replace(/\/$/, "");
      const urlAccessible = await isSourceUrlAccessible(normalizedUrl);

      if (urlAccessible) {
        const { data: existingSource } = await supabase
          .from("host_lead_sources")
          .select("id")
          .eq("source_url", normalizedUrl)
          .maybeSingle();

        if (!existingSource) {
          await supabase.from("host_lead_sources").insert({
            lead_id: lead.id,
            source_type: result.sourceType,
            source_url: normalizedUrl,
            title: result.title,
            snippet: result.snippet,
            published_at: result.publishedAt ?? null,
          });
        }
      }

      const { data: sources } = await supabase
        .from("host_lead_sources")
        .select("*")
        .eq("lead_id", lead.id)
        .order("discovered_at", { ascending: false });

      const accessibleSources = await filterAccessibleSources(
        (sources as HostLeadSource[]) ?? []
      );

      leads.push({
        ...(lead as HostLead),
        sources: accessibleSources,
      });
    }

    const highPriorityCount = leads.filter((l) => l.priority === "high_priority").length;

    const { data: completedSearch } = await supabase
      .from("host_searches")
      .update({
        status: "completed",
        leads_found: leads.length,
        high_priority_count: highPriorityCount,
        provider_used: provider.name,
        completed_at: new Date().toISOString(),
      })
      .eq("id", search.id)
      .select("*")
      .single();

    return {
      search: (completedSearch as HostSearch) ?? search,
      leads,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    await supabase
      .from("host_searches")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", search.id);
    throw err;
  }
}

export async function loadSearchWithLeads(
  supabase: SupabaseClient,
  searchId: string
): Promise<{ search: HostSearch; leads: HostLeadWithSources[] } | null> {
  const { data: search } = await supabase
    .from("host_searches")
    .select("*")
    .eq("id", searchId)
    .single();

  if (!search) return null;

  const { data: leads } = await supabase
    .from("host_leads")
    .select("*")
    .eq("search_id", searchId)
    .is("dismissed_at", null)
    .order("score", { ascending: false });

  if (!leads?.length) {
    return { search: search as HostSearch, leads: [] };
  }

  const leadIds = leads.map((l) => l.id);
  const { data: sources } = await supabase
    .from("host_lead_sources")
    .select("*")
    .in("lead_id", leadIds);

  const sourcesByLead = new Map<string, HostLeadSource[]>();
  for (const src of (sources as HostLeadSource[]) ?? []) {
    const list = sourcesByLead.get(src.lead_id) ?? [];
    list.push(src);
    sourcesByLead.set(src.lead_id, list);
  }

  const leadsWithSources: HostLeadWithSources[] = (leads as HostLead[]).map((lead) => ({
    ...lead,
    sources: sourcesByLead.get(lead.id) ?? [],
  }));

  return {
    search: search as HostSearch,
    leads: await withAccessibleSourcesForLeads(leadsWithSources),
  };
}
