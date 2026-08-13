"use client";

import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Card } from "@/components/ui/Card";
import type { HostFinderAnalytics } from "@/lib/host-finder/analytics";
import { sourceTypeLabel } from "@/lib/host-finder/source-type";
import type { HostLeadSourceType } from "@/lib/host-finder/types";
import { HOST_FINDER_HOST_TYPES } from "@/lib/host-finder/types";

interface HostAnalyticsPanelProps {
  analytics: HostFinderAnalytics;
}

function hostTypeLabel(value: string): string {
  return HOST_FINDER_HOST_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function HostAnalyticsPanel({ analytics }: HostAnalyticsPanelProps) {
  const { totals } = analytics;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard label="Total leads discovered" value={totals.discovered} />
        <AdminStatCard label="High-priority leads" value={totals.highPriority} />
        <AdminStatCard label="Leads contacted" value={totals.contacted} />
        <AdminStatCard label="Interested leads" value={totals.interested} />
        <AdminStatCard label="Applications started" value={totals.applicationStarted} />
        <AdminStatCard label="Verified hosts" value={totals.verified} />
        <AdminStatCard label="Signed-up hosts" value={totals.signedUp} />
        <AdminStatCard
          label="Conversion rate"
          value={`${totals.conversionRate}%`}
          hint="Signed up / discovered"
        />
      </div>

      <Card variant="outline" padding="md">
        <h3 className="text-lg font-bold text-forest mb-4">Where are your best hosts coming from?</h3>
        {analytics.bySource.length === 0 ? (
          <p className="text-sm text-charcoal-light">No source data yet. Run a Host Finder search to get started.</p>
        ) : (
          <div className="space-y-2">
            {analytics.bySource.map((row) => (
              <div
                key={row.source}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-sage-dark/20 last:border-0"
              >
                <span className="font-medium text-charcoal">
                  {sourceTypeLabel(row.source as HostLeadSourceType)}
                </span>
                <span className="text-sm text-charcoal-light">
                  {row.count} leads · {row.verified} verified · {row.signedUp} signed up
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="outline" padding="md">
          <h3 className="text-lg font-bold text-forest mb-4">By country</h3>
          {analytics.byCountry.length === 0 ? (
            <p className="text-sm text-charcoal-light">No data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.byCountry.slice(0, 10).map((row) => (
                <li key={row.country} className="flex justify-between">
                  <span>{row.country}</span>
                  <span className="text-charcoal-light">
                    {row.count} ({row.highPriority} high priority)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="outline" padding="md">
          <h3 className="text-lg font-bold text-forest mb-4">By host type</h3>
          {analytics.byHostType.length === 0 ? (
            <p className="text-sm text-charcoal-light">No data yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {analytics.byHostType.map((row) => (
                <li key={row.hostType} className="flex justify-between">
                  <span>{hostTypeLabel(row.hostType)}</span>
                  <span className="text-charcoal-light">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card variant="outline" padding="md">
        <h3 className="text-lg font-bold text-forest mb-4">Discovery over time</h3>
        {analytics.byDate.length === 0 ? (
          <p className="text-sm text-charcoal-light">No data yet.</p>
        ) : (
          <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
            {analytics.byDate.map((row) => (
              <li key={row.date} className="flex justify-between py-1">
                <span>{row.date}</span>
                <span className="text-charcoal-light">
                  {row.discovered} discovered · {row.highPriority} high priority
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
