import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, AdminBadgeCell, AdminDateCell } from "@/components/admin/AdminTable";
import type { Profile } from "@/types/database";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, verification_status, trust_score, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (users as Pick<
    Profile,
    "id" | "full_name" | "email" | "role" | "verification_status" | "trust_score" | "created_at"
  >[]) ?? [];

  return (
    <AdminShell title="Users" description="All platform members.">
      <AdminTable
        rows={rows}
        columns={[
          { key: "name", label: "Name", render: (r) => r.full_name ?? "—" },
          { key: "email", label: "Email", render: (r) => r.email },
          {
            key: "role",
            label: "Role",
            render: (r) => (r.role ? <AdminBadgeCell label={r.role} /> : "—"),
          },
          {
            key: "verification",
            label: "Verification",
            render: (r) => <AdminBadgeCell label={r.verification_status} variant="outline" />,
          },
          { key: "trust", label: "Trust", render: (r) => r.trust_score },
          { key: "joined", label: "Joined", render: (r) => <AdminDateCell value={r.created_at} /> },
        ]}
      />
    </AdminShell>
  );
}
