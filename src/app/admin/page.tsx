import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export const metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: hostCount },
    { count: listingCount },
    { count: pendingVerifications },
    { count: pendingReviews },
    { count: openReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "host"),
    supabase.from("host_listings").select("*", { count: "exact", head: true }),
    supabase
      .from("verification_documents")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "in_review"]),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("moderation_status", "pending"),
    supabase
      .from("content_reports")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]),
  ]);

  return (
    <AdminShell
      title="Overview"
      description="Platform health and moderation queue summary."
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard label="Total users" value={userCount ?? 0} />
        <AdminStatCard label="Hosts" value={hostCount ?? 0} />
        <AdminStatCard label="Listings" value={listingCount ?? 0} />
        <AdminStatCard label="Pending verifications" value={pendingVerifications ?? 0} />
        <AdminStatCard label="Reviews to moderate" value={pendingReviews ?? 0} />
        <AdminStatCard label="Open reports" value={openReports ?? 0} />
      </div>
    </AdminShell>
  );
}
