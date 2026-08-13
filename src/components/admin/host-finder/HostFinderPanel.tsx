"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HostLeadCard } from "@/components/admin/host-finder/HostLeadCard";
import {
  HOST_FINDER_HOST_TYPES,
  type HostFinderHostType,
  type HostLeadWithSources,
  type HostSearch,
} from "@/lib/host-finder/types";

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Spain",
  "Italy",
  "Netherlands",
  "New Zealand",
  "Ireland",
];

interface HostFinderPanelProps {
  initialSearchId?: string;
  configured: boolean;
  openAiConfigured: boolean;
  provider: string;
}

export function HostFinderPanel({
  initialSearchId,
  configured,
  openAiConfigured,
  provider,
}: HostFinderPanelProps) {
  const [country, setCountry] = useState("United States");
  const [region, setRegion] = useState("");
  const [hostType, setHostType] = useState<HostFinderHostType>(
    "experienced_cultural_exchange_host"
  );
  const [leadsRequested, setLeadsRequested] = useState(20);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [leads, setLeads] = useState<HostLeadWithSources[]>([]);
  const [lastSearch, setLastSearch] = useState<HostSearch | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSearch(searchId: string) {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/host-finder/searches/${searchId}`);
      const data = (await res.json()) as {
        search?: HostSearch;
        leads?: HostLeadWithSources[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load search.");
      if (data.search) {
        setLastSearch(data.search);
        setCountry(data.search.country);
        setRegion(data.search.region ?? "");
        setHostType(data.search.host_type);
        setLeadsRequested(data.search.leads_requested);
      }
      setLeads(data.leads ?? []);
      setSearchStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load search.");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (initialSearchId) {
      void loadSearch(initialSearchId);
    }
  }, [initialSearchId]);

  async function handleSearch() {
    if (!configured || !openAiConfigured) {
      setError(
        "Host Finder requires OPENAI_API_KEY and a configured search provider. See .env.example."
      );
      return;
    }

    setSearching(true);
    setError(null);
    setLeads([]);
    setSearchStatus(
      "Searching for people with demonstrated interest in hosting and cultural exchange..."
    );

    try {
      const res = await fetch("/api/admin/host-finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          region: region.trim() || undefined,
          hostType,
          leadsRequested,
        }),
      });

      const data = (await res.json()) as {
        search?: HostSearch;
        leads?: HostLeadWithSources[];
        error?: string;
      };

      if (!res.ok) throw new Error(data.error ?? "Search failed.");

      setLastSearch(data.search ?? null);
      setLeads(data.leads ?? []);
      setSearchStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      setSearchStatus(null);
    } finally {
      setSearching(false);
    }
  }

  const canSearch = configured && openAiConfigured;

  return (
    <div className="space-y-8">
      {!canSearch && (
        <Card variant="outline" padding="md" className="border-amber-200 bg-amber-50/50">
          <p className="text-sm text-amber-900">
            Host Finder needs <code className="text-xs">OPENAI_API_KEY</code> and a search provider.
            Set <code className="text-xs">HOST_FINDER_SEARCH_PROVIDER</code> to{" "}
            <code className="text-xs">serper</code>, <code className="text-xs">tavily</code>, or{" "}
            <code className="text-xs">mock</code> (dev). Current provider:{" "}
            <strong>{provider}</strong>.
          </p>
        </Card>
      )}

      <Card variant="elevated" padding="lg" className="max-w-xl">
        <h2 className="text-xl font-bold text-forest mb-6">Find your next host</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-charcoal">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Region"
            placeholder="Optional — e.g. California"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-charcoal">Host type</label>
            <select
              value={hostType}
              onChange={(e) => setHostType(e.target.value as HostFinderHostType)}
              className="w-full rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            >
              {HOST_FINDER_HOST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Number of leads"
            type="number"
            min={1}
            max={100}
            value={leadsRequested}
            onChange={(e) => setLeadsRequested(Number(e.target.value) || 20)}
          />

          <Button
            size="lg"
            className="w-full"
            isLoading={searching}
            disabled={!canSearch}
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
            Find potential hosts
          </Button>
        </div>
      </Card>

      {searchStatus && (
        <p className="text-sm text-charcoal-light animate-pulse">{searchStatus}</p>
      )}

      {error && (
        <Card variant="outline" padding="md" className="border-red-200 bg-red-50/50">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {lastSearch && !searching && (
        <p className="text-sm text-charcoal-light">
          Found {lastSearch.leads_found} leads ({lastSearch.high_priority_count} high priority)
        </p>
      )}

      {leads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-forest">Ranked leads</h3>
          {leads.map((lead) => (
            <HostLeadCard
              key={lead.id}
              lead={lead}
              onUpdate={(updated) =>
                setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
              }
              onDismiss={(id) => setLeads((prev) => prev.filter((l) => l.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
