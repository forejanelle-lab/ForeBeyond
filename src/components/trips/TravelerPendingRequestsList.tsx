"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  TravelerPendingRequestListCard,
  TravelerPendingRequestTableRow,
  type TravelerPendingRequestRow,
} from "@/components/trips/TravelerPendingRequestTable";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface TravelerPendingRequestsListProps {
  requests: TravelerPendingRequestRow[];
}

export function TravelerPendingRequestsList({ requests }: TravelerPendingRequestsListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "date">("newest");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = requests.filter((row) => {
      if (!q) return true;
      return `${row.listingTitle} ${row.location ?? ""} ${row.hostName ?? ""} ${row.request.status}`
        .toLowerCase()
        .includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "date") {
        const da = new Date(a.request.start_date ?? 0).getTime();
        const db = new Date(b.request.start_date ?? 0).getTime();
        return da - db;
      }
      const ta = new Date(a.request.created_at).getTime();
      const tb = new Date(b.request.created_at).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    return rows;
  }, [requests, query, sort]);

  if (requests.length === 0) {
    return (
      <Card variant="outline" padding="lg" className="text-center py-10">
        <p className="text-charcoal-light">No pending requests. Browse families to send a stay request.</p>
        <Link href="/search" className="inline-block mt-4 text-sm font-medium text-forest hover:underline">
          Search families
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-light" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search family, location, or status..."
            className="pl-9"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-sage-dark bg-white px-3 py-2.5 text-sm shrink-0"
        >
          <option value="newest">Newest request</option>
          <option value="oldest">Oldest request</option>
          <option value="date">Soonest check-in</option>
        </select>
      </div>

      <Card variant="outline" className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <p className="text-sm text-charcoal-light text-center py-10 px-4">No requests match your search.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="bg-sage/40 border-b border-sage-dark/30 text-[10px] font-semibold uppercase tracking-wide text-charcoal-light">
                    <th className="px-4 py-3 text-left font-semibold w-[28%]">Family</th>
                    <th className="px-4 py-3 text-left font-semibold w-[16%]">Location</th>
                    <th className="px-4 py-3 text-left font-semibold w-[24%]">Dates</th>
                    <th className="px-4 py-3 text-right font-semibold w-[14%]">Est. total</th>
                    <th className="px-4 py-3 text-right font-semibold w-[18%]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <TravelerPendingRequestTableRow
                      key={row.request.id}
                      {...row}
                      href={`/dashboard/requests/${row.request.id}`}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-sage-dark/20 md:hidden">
              {filtered.map((row) => (
                <TravelerPendingRequestListCard
                  key={row.request.id}
                  {...row}
                  href={`/dashboard/requests/${row.request.id}`}
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
