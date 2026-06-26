"use client";

import { useState } from "react";
import Link from "next/link";
import { StayRequestCard } from "@/components/stays/StayRequestCard";
import type { StayRequest } from "@/types/database";

interface DashboardRequestTabsProps {
  requests: StayRequest[];
  listingMap: Record<string, string>;
  otherPartyMap: Record<string, string>;
  hrefPrefix: string;
  viewAllHref: string;
}

const tabOptions = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "declined", label: "Declined" },
] as const;

export function DashboardRequestTabs({
  requests,
  listingMap,
  otherPartyMap,
  hrefPrefix,
  viewAllHref,
}: DashboardRequestTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabOptions)[number]["id"]>("pending");

  const filtered = requests.filter((r) => r.status === activeTab);

  return (
    <div>
      <div className="flex gap-1 border-b border-sage-dark/30 mb-6">
        {tabOptions.map((tab) => {
          const count = requests.filter((r) => r.status === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-forest text-forest"
                  : "border-transparent text-charcoal-light hover:text-forest"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-charcoal-light">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-charcoal-light py-8 text-center rounded-2xl bg-sage/30">
          No {activeTab} requests.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <StayRequestCard
              key={request.id}
              request={request}
              listingTitle={request.listing_id ? listingMap[request.listing_id] : null}
              otherPartyName={
                otherPartyMap[request.host_id] ?? otherPartyMap[request.traveler_id] ?? null
              }
              href={`${hrefPrefix}/${request.id}`}
            />
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <Link href={viewAllHref} className="inline-block mt-4 text-sm font-medium text-forest hover:underline">
          View all requests →
        </Link>
      )}
    </div>
  );
}
