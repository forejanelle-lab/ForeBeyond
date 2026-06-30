import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminReportsPanel } from "@/components/admin/AdminReportsPanel";
import type { ContentReport, Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Reports",
  description: "Review user reports in Fore Beyond admin.",
  path: "/admin/reports",
});

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const typedReports = (reports as ContentReport[]) ?? [];
  const reporterIds = [
    ...new Set(typedReports.map((r) => r.reporter_id).filter(Boolean)),
  ] as string[];

  const { data: profiles } = reporterIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", reporterIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles as Pick<Profile, "id" | "full_name" | "email">[] | null)?.map((p) => [p.id, p]) ??
      []
  );

  const rows = typedReports.map((report) => ({
    ...report,
    reporter_name: report.reporter_id
      ? (profileMap.get(report.reporter_id)?.full_name ?? null)
      : null,
    reporter_email: report.reporter_id
      ? (profileMap.get(report.reporter_id)?.email ?? null)
      : null,
  }));

  return (
    <AdminShell title="Reports" description="User-submitted content and conduct reports.">
      <AdminReportsPanel reports={rows} />
    </AdminShell>
  );
}
