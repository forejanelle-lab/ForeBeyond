"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StayRequestListCard, StayRequestTableRow } from "@/components/stays/StayRequestListCard";
import { guestProfilePath } from "@/lib/host-guest-access";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { ListingPricing } from "@/lib/stay-requests";
import type { StayRequest, StayRequestStatus } from "@/types/database";

const HOST_REQUEST_STATUS_PRIORITY: Record<StayRequestStatus, number> = {
  approved: 0,
  host_approved: 1,
  pending: 2,
  completed: 3,
  rejected: 4,
  cancelled: 5,
};

function compareHostRequestStatus(a: StayRequest, b: StayRequest) {
  return (
    (HOST_REQUEST_STATUS_PRIORITY[a.status] ?? 99) -
    (HOST_REQUEST_STATUS_PRIORITY[b.status] ?? 99)
  );
}

export interface HostRequestRow {
  request: StayRequest;
  travelerId: string;
  travelerName: string;
  listingTitle: string;
  listingPricing: ListingPricing;
  incomeTotal: number | null;
}

interface HostRequestsListProps {
  requests: HostRequestRow[];
}

export function HostRequestsList({ requests }: HostRequestsListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "host_approved" | "approved" | "rejected">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "income">("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = requests.filter(({ request, travelerName, listingTitle }) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!q) return true;
      return `${travelerName} ${listingTitle} ${request.status}`.toLowerCase().includes(q);
    });

    rows = [...rows].sort((a, b) => {
      const statusDiff = compareHostRequestStatus(a.request, b.request);
      if (statusDiff !== 0) return statusDiff;

      if (sort === "income") {
        return (b.incomeTotal ?? 0) - (a.incomeTotal ?? 0);
      }
      const ta = new Date(a.request.created_at).getTime();
      const tb = new Date(b.request.created_at).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    return rows;
  }, [requests, query, statusFilter, sort]);

  if (requests.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-12">
        <p className="text-charcoal-light">No requests yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest or listing..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="host_approved">Awaiting traveler</option>
          <option value="approved">Approved</option>
          <option value="rejected">Declined</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="income">Highest income</option>
        </select>
      </div>

      <Card variant="outline" className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-charcoal-light text-center py-10 px-4">No requests match your filters.</p>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-sage/40 border-b border-sage-dark/30 text-[10px] font-semibold uppercase tracking-wide text-charcoal-light">
                    <th className="px-4 py-3 text-left font-semibold w-[32%]">Guest</th>
                    <th className="px-4 py-3 text-left font-semibold w-[28%]">Dates</th>
                    <th className="px-4 py-3 text-right font-semibold w-[14%]">Value</th>
                    <th className="px-4 py-3 text-right font-semibold w-[26%]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <StayRequestTableRow
                      key={row.request.id}
                      request={row.request}
                      travelerName={row.travelerName}
                      guestProfileHref={guestProfilePath(row.travelerId, row.request.id)}
                      listingTitle={row.listingTitle}
                      incomeTotal={row.incomeTotal}
                      href={`/host/requests/${row.request.id}`}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-sage-dark/20 sm:hidden">
              {filtered.map((row) => (
                <StayRequestListCard
                  key={row.request.id}
                  request={row.request}
                  travelerName={row.travelerName}
                  guestProfileHref={guestProfilePath(row.travelerId, row.request.id)}
                  listingTitle={row.listingTitle}
                  incomeTotal={row.incomeTotal}
                  href={`/host/requests/${row.request.id}`}
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
