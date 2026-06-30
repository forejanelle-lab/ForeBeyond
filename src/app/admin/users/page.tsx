import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import type { Profile } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Users",
  description: "Manage platform users in Fore Beyond admin.",
  path: "/admin/users",
});

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, verification_status, trust_score, created_at, last_login_at, last_active_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows =
    (users as Pick<
      Profile,
      | "id"
      | "full_name"
      | "email"
      | "role"
      | "verification_status"
      | "trust_score"
      | "created_at"
      | "last_login_at"
      | "last_active_at"
    >[]) ?? [];

  return (
    <AdminShell wide title="Users" description="Search, filter, and manage platform members.">
      <Suspense fallback={<p className="text-sm text-charcoal-light">Loading users…</p>}>
        <AdminUsersPanel users={rows} />
      </Suspense>
    </AdminShell>
  );
}
