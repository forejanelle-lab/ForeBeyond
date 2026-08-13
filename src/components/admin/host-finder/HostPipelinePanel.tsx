"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import {
  HOST_PIPELINE_STATUSES,
  pipelineStatusLabel,
  priorityLabel,
  type HostLeadWithSources,
  type HostPipelineStatus,
} from "@/lib/host-finder/types";
import { sourceTypeLabel } from "@/lib/host-finder/source-type";
import { formatAdminDate } from "@/lib/admin";

interface HostPipelinePanelProps {
  initialLeads: HostLeadWithSources[];
}

export function HostPipelinePanel({ initialLeads }: HostPipelinePanelProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<HostPipelineStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeads[0]?.id ?? null
  );

  const filtered =
    filter === "all" ? leads : leads.filter((l) => l.pipeline_status === filter);

  const selected = leads.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  async function updateLead(id: string, updates: { pipelineStatus?: HostPipelineStatus; notes?: string }) {
    const res = await fetch(`/api/admin/host-finder/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipelineStatus: updates.pipelineStatus,
        notes: updates.notes,
      }),
    });
    const data = (await res.json()) as { lead?: HostLeadWithSources; error?: string };
    if (!res.ok) {
      alert(data.error ?? "Update failed.");
      return;
    }
    if (data.lead) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...data.lead!, sources: l.sources } : l))
      );
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-3">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === "all" ? "bg-forest text-white" : "bg-sage/60 text-forest"
            }`}
          >
            All ({leads.length})
          </button>
          {HOST_PIPELINE_STATUSES.map((status) => {
            const count = leads.filter((l) => l.pipeline_status === status).length;
            if (count === 0) return null;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filter === status ? "bg-forest text-white" : "bg-sage/60 text-forest"
                }`}
              >
                {pipelineStatusLabel(status)} ({count})
              </button>
            );
          })}
        </div>

        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.map((lead) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => setSelectedId(lead.id)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                selected?.id === lead.id
                  ? "border-forest bg-sage/40"
                  : "border-sage-dark bg-white hover:bg-sage/20"
              }`}
            >
              <p className="font-medium text-forest text-sm">{lead.name}</p>
              <p className="text-xs text-charcoal-light mt-0.5">
                {lead.score}/100 · {priorityLabel(lead.priority)}
              </p>
              <Badge variant="outline" className="mt-1">
                {pipelineStatusLabel(lead.pipeline_status)}
              </Badge>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-charcoal-light">No leads in pipeline yet.</p>
          )}
        </div>
      </div>

      {selected && (
        <Card variant="outline" padding="md" className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-forest">{selected.name}</h3>
              <p className="text-sm text-charcoal-light">
                Discovered {formatAdminDate(selected.discovered_at)}
              </p>
            </div>
            <Badge variant="gold">{priorityLabel(selected.priority)}</Badge>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-charcoal">Status</label>
            <select
              value={selected.pipeline_status}
              onChange={(e) =>
                updateLead(selected.id, {
                  pipelineStatus: e.target.value as HostPipelineStatus,
                })
              }
              className="w-full max-w-xs rounded-xl border border-sage-dark bg-white px-4 py-2.5 text-sm"
            >
              {HOST_PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {pipelineStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {selected.evidence_excerpt && (
            <blockquote className="border-l-2 border-sage-dark pl-3 text-sm text-charcoal-light italic">
              &ldquo;{selected.evidence_excerpt}&rdquo;
            </blockquote>
          )}

          {selected.sources.length > 0 && (
            <div>
              <p className="text-sm font-medium text-charcoal mb-1">Sources</p>
              <ul className="text-sm space-y-1">
                {selected.sources.map((src) => (
                  <li key={src.id}>
                    <a
                      href={src.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest hover:underline"
                    >
                      {sourceTypeLabel(src.source_type)} — {src.title ?? src.source_url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Textarea
            label="Notes"
            value={selected.notes ?? ""}
            onChange={(e) =>
              setLeads((prev) =>
                prev.map((l) =>
                  l.id === selected.id ? { ...l, notes: e.target.value } : l
                )
              )
            }
            onBlur={(e) => updateLead(selected.id, { notes: e.target.value })}
            rows={4}
          />

          {selected.outreach_draft && (
            <div>
              <p className="text-sm font-medium text-charcoal mb-1">Outreach draft</p>
              <p className="text-sm text-charcoal-light whitespace-pre-wrap">
                {selected.outreach_draft}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
