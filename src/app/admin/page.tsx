import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin Overview",
  description: "Fore Beyond platform administration.",
  path: "/admin",
});

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: hostCount },
    { count: listingCount },
    { count: pendingVerifications },
    { count: pendingReviews },
    { count: openReports },
    { count: openSupport },
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
    supabase
      .from("support_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  return (
    <AdminShell
      title="Overview"
      description="Platform health and moderation queue summary."
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard accent="platform" label="Total users" value={userCount ?? 0} href="/admin/users" />
        <AdminStatCard accent="platform" label="Hosts" value={hostCount ?? 0} href="/admin/users?role=host" />
        <AdminStatCard accent="platform" label="Listings" value={listingCount ?? 0} href="/admin/listings" />
        <AdminStatCard
          accent="moderation"
          label="Pending verifications"
          value={pendingVerifications ?? 0}
          href="/admin/verifications"
        />
        <AdminStatCard
          accent="moderation"
          label="Guest reviews to moderate"
          value={pendingReviews ?? 0}
          href="/admin/reviews"
        />
        <AdminStatCard accent="moderation" label="Open reports" value={openReports ?? 0} href="/admin/reports" />
        <AdminStatCard accent="moderation" label="Open support" value={openSupport ?? 0} href="/admin/support" />
      </div>
    </AdminShell>
  );
}
