"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatAdminDateTime } from "@/lib/admin";
import {
  HOST_FINDER_HOST_TYPES,
  type HostSearch,
} from "@/lib/host-finder/types";

interface HostSearchHistoryPanelProps {
  searches: HostSearch[];
}

function hostTypeLabel(value: string): string {
  return HOST_FINDER_HOST_TYPES.find((t) => t.value === value)?.label ?? value;
}

function statusBadge(status: HostSearch["status"]) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "failed":
      return <Badge variant="warning">Failed</Badge>;
    case "running":
      return <Badge variant="gold">Running</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function HostSearchHistoryPanel({ searches }: HostSearchHistoryPanelProps) {
  if (searches.length === 0) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">
          No searches yet.{" "}
          <Link href="/admin/host-growth/finder" className="text-forest hover:underline">
            Run your first Host Finder search
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <Card key={search.id} variant="outline" padding="md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-forest">
                {search.region ? `${search.region}, ` : ""}
                {search.country}
              </p>
              <p className="text-sm text-charcoal-light mt-0.5">
                {hostTypeLabel(search.host_type)} · {search.leads_requested} requested
              </p>
              <p className="text-xs text-charcoal-light mt-1">
                {formatAdminDateTime(search.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {statusBadge(search.status)}
              {search.status === "completed" && (
                <p className="text-sm text-charcoal-light">
                  {search.leads_found} found · {search.high_priority_count} high priority
                </p>
              )}
              {search.status === "failed" && search.error_message && (
                <p className="text-xs text-red-600 max-w-xs text-right">{search.error_message}</p>
              )}
            </div>
          </div>
          {search.status === "completed" && (
            <Link
              href={`/admin/host-growth/finder?search=${search.id}`}
              className="inline-block mt-3 text-sm font-medium text-forest hover:underline"
            >
              Reopen search results →
            </Link>
          )}
        </Card>
      ))}
    </div>
  );
}
