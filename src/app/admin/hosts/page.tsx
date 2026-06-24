import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, AdminBadgeCell, AdminDateCell } from "@/components/admin/AdminTable";
import type { Profile } from "@/types/database";

export const metadata = { title: "Admin — Hosts" };

export default async function AdminHostsPage() {
  const supabase = await createClient();
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, full_name, email, verification_status, trust_score, location, created_at")
    .eq("role", "host")
    .order("trust_score", { ascending: false })
    .limit(100);

  const rows = (hosts as Pick<
    Profile,
    "id" | "full_name" | "email" | "verification_status" | "trust_score" | "location" | "created_at"
  >[]) ?? [];

  return (
    <AdminShell title="Hosts" description="Verified families and host accounts.">
      <AdminTable
        rows={rows}
        columns={[
          { key: "name", label: "Name", render: (r) => r.full_name ?? "—" },
          { key: "email", label: "Email", render: (r) => r.email },
          { key: "location", label: "Location", render: (r) => r.location ?? "—" },
          {
            key: "verification",
            label: "Verification",
            render: (r) => <AdminBadgeCell label={r.verification_status} variant="outline" />,
          },
          { key: "trust", label: "Trust Score", render: (r) => r.trust_score },
          { key: "joined", label: "Joined", render: (r) => <AdminDateCell value={r.created_at} /> },
        ]}
      />
    </AdminShell>
  );
}
