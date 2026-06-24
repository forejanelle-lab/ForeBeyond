import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminReportsPanel } from "@/components/admin/AdminReportsPanel";
import type { ContentReport } from "@/types/database";

export const metadata = { title: "Admin — Reports" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("content_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AdminShell title="Reports" description="User-submitted content and conduct reports.">
      <AdminReportsPanel reports={(reports as ContentReport[]) ?? []} />
    </AdminShell>
  );
}
