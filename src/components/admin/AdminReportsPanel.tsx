"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ContentReport, ReportStatus } from "@/types/database";

interface AdminReportsPanelProps {
  reports: ContentReport[];
}

export function AdminReportsPanel({ reports: initial }: AdminReportsPanelProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function resolveReport(reportId: string, status: ReportStatus) {
    setLoadingId(reportId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from("content_reports")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id ?? null,
        admin_notes: status === "resolved" ? "Resolved by admin" : "Dismissed by admin",
      })
      .eq("id", reportId);

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status } : r))
    );
    setLoadingId(null);
    router.refresh();
  }

  const pending = reports.filter((r) => r.status === "pending" || r.status === "reviewing");

  return (
    <div className="space-y-4">
      {pending.length === 0 ? (
        <p className="text-sm text-charcoal-light">No open reports.</p>
      ) : (
        pending.map((report) => (
          <div
            key={report.id}
            className="rounded-xl border border-sage-dark/30 bg-white p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">{report.status}</Badge>
              <Badge variant="outline">{report.category}</Badge>
            </div>
            <p className="text-sm text-charcoal-light">{report.description}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={loadingId === report.id}
                onClick={() => resolveReport(report.id, "resolved")}
              >
                <Check className="h-4 w-4" />
                Resolve
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingId === report.id}
                onClick={() => resolveReport(report.id, "dismissed")}
              >
                <X className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
