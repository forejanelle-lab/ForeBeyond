"use client";

import { useState } from "react";
import { ExternalLink, MessageSquare, UserPlus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  priorityLabel,
  type HostLeadWithSources,
} from "@/lib/host-finder/types";
import { sourceTypeLabel } from "@/lib/host-finder/source-type";

function priorityBadgeVariant(
  priority: HostLeadWithSources["priority"]
): "success" | "gold" | "warning" | "outline" {
  switch (priority) {
    case "high_priority":
      return "success";
    case "good_prospect":
      return "gold";
    case "possible":
      return "warning";
    default:
      return "outline";
  }
}

interface HostLeadCardProps {
  lead: HostLeadWithSources;
  onUpdate?: (lead: HostLeadWithSources) => void;
  onDismiss?: (leadId: string) => void;
}

export function HostLeadCard({ lead, onUpdate, onDismiss }: HostLeadCardProps) {
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState(lead.outreach_draft ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  const primarySource = lead.sources[0];

  async function handleGenerateOutreach() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/host-finder/leads/${lead.id}/outreach`, {
        method: "POST",
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate outreach.");
      setOutreachMessage(data.message ?? "");
      setOutreachOpen(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate outreach.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveOutreach() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/host-finder/leads/${lead.id}/outreach`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: outreachMessage }),
      });
      if (!res.ok) throw new Error("Failed to save outreach draft.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToPipeline() {
    setPipelineLoading(true);
    try {
      const res = await fetch(`/api/admin/host-finder/leads/${lead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_to_pipeline" }),
      });
      const data = (await res.json()) as { lead?: HostLeadWithSources; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to add to pipeline.");
      if (data.lead) onUpdate?.({ ...lead, ...data.lead, sources: lead.sources });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add to pipeline.");
    } finally {
      setPipelineLoading(false);
    }
  }

  async function handleDismiss() {
    if (!confirm("Dismiss this lead? It will be hidden from future results.")) return;
    try {
      const res = await fetch(`/api/admin/host-finder/leads/${lead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });
      if (!res.ok) throw new Error("Failed to dismiss lead.");
      onDismiss?.(lead.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to dismiss.");
    }
  }

  return (
    <Card variant="outline" padding="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-forest">{lead.name}</h3>
            <span className="text-sm font-semibold text-charcoal">
              {lead.score} / 100
            </span>
            <Badge variant={priorityBadgeVariant(lead.priority)}>
              {priorityLabel(lead.priority)}
            </Badge>
          </div>
          {(lead.country || lead.region) && (
            <p className="text-sm text-charcoal-light mt-1">
              {[lead.region, lead.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {primarySource && (
        <div className="text-sm space-y-1">
          <p className="font-medium text-charcoal">
            Source: {sourceTypeLabel(primarySource.source_type)}
          </p>
          {lead.evidence_excerpt && (
            <blockquote className="border-l-2 border-sage-dark pl-3 text-charcoal-light italic">
              &ldquo;{lead.evidence_excerpt}&rdquo;
            </blockquote>
          )}
        </div>
      )}

      {lead.why_good_fit.length > 0 && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">Why they may be a fit</p>
          <ul className="text-sm text-charcoal-light list-disc list-inside space-y-0.5">
            {lead.why_good_fit.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {lead.host_experience && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">Host experience</p>
          <p className="text-sm text-charcoal-light">{lead.host_experience}</p>
        </div>
      )}

      {lead.potential_concerns.length > 0 && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">Potential concerns</p>
          <ul className="text-sm text-charcoal-light list-disc list-inside space-y-0.5">
            {lead.potential_concerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {lead.recommended_approach && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">Recommended approach</p>
          <p className="text-sm text-charcoal-light">{lead.recommended_approach}</p>
        </div>
      )}

      {lead.sources.length > 1 && (
        <div>
          <p className="text-sm font-medium text-charcoal mb-1">
            Additional sources ({lead.sources.length - 1})
          </p>
          <ul className="text-xs text-charcoal-light space-y-1">
            {lead.sources.slice(1).map((src) => (
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

      {outreachOpen && (
        <div className="space-y-2 pt-2 border-t border-sage-dark/30">
          <p className="text-sm font-medium text-charcoal">Outreach message (editable)</p>
          <Textarea
            value={outreachMessage}
            onChange={(e) => setOutreachMessage(e.target.value)}
            rows={6}
            className="text-sm"
          />
          <Button size="sm" variant="secondary" isLoading={saving} onClick={handleSaveOutreach}>
            Save draft
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-sage-dark/30">
        {primarySource && (
          <a
            href={primarySource.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 border-2 border-forest text-forest hover:bg-forest hover:text-white px-3 py-1.5 text-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View source
          </a>
        )}
        <Button
          size="sm"
          variant="secondary"
          isLoading={generating}
          onClick={handleGenerateOutreach}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Generate outreach
        </Button>
        <Button
          size="sm"
          variant="primary"
          isLoading={pipelineLoading}
          onClick={handleAddToPipeline}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add to pipeline
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <X className="h-3.5 w-3.5" />
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
