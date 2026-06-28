"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatAdminDateTime } from "@/lib/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import type { ContentReport, ReportStatus } from "@/types/database";

type AdminReportRow = ContentReport & {
  reporter_name: string | null;
  reporter_email: string | null;
};

interface AdminReportsPanelProps {
  reports: AdminReportRow[];
}

export function AdminReportsPanel({ reports: initial }: AdminReportsPanelProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [internalComments, setInternalComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function resolveReport(reportId: string, status: ReportStatus) {
    setLoadingId(reportId);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminNotes = internalComments[reportId]?.trim() || null;

    const { error: updateError } = await supabase
      .from("content_reports")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id ?? null,
        admin_notes: adminNotes,
      })
      .eq("id", reportId);

    if (updateError) {
      setError(updateError.message);
      setLoadingId(null);
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status, admin_notes: adminNotes } : r
      )
    );
    setInternalComments((prev) => {
      const next = { ...prev };
      delete next[reportId];
      return next;
    });
    setLoadingId(null);
    router.refresh();
  }

  const pending = reports.filter((r) => r.status === "pending" || r.status === "reviewing");

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
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
            <div className="rounded-xl bg-sage/30 px-4 py-3 text-sm space-y-1">
              <p className="text-charcoal-light">
                <span className="font-medium text-forest">Reported by:</span>{" "}
                {report.reporter_id ? (
                  <Link
                    href={`/admin/users/${report.reporter_id}`}
                    className="text-forest hover:underline"
                  >
                    {report.reporter_name ?? "Unknown user"}
                  </Link>
                ) : (
                  "Unknown user"
                )}
              </p>
              <p className="text-charcoal-light">
                <span className="font-medium text-forest">Email:</span>{" "}
                {report.reporter_email ? (
                  <a href={`mailto:${report.reporter_email}`} className="text-forest hover:underline">
                    {report.reporter_email}
                  </a>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-charcoal-light">
                <span className="font-medium text-forest">Reported at:</span>{" "}
                {formatAdminDateTime(report.created_at)}
              </p>
            </div>
            <p className="text-sm text-charcoal-light">{report.description}</p>
            <Textarea
              label="Internal comments"
              hint="Saved when you resolve or dismiss. Not visible to members."
              value={internalComments[report.id] ?? ""}
              onChange={(e) =>
                setInternalComments((prev) => ({ ...prev, [report.id]: e.target.value }))
              }
              placeholder="Notes for your team (optional)…"
              rows={3}
              disabled={loadingId === report.id}
            />
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
