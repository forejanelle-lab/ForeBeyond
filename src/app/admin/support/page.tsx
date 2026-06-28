import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSupportPanel } from "@/components/admin/AdminSupportPanel";
import type { SupportRequest } from "@/types/database";

export const metadata = { title: "Admin — Support" };

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminShell
      title="Support"
      description="Review member help requests, respond, and resolve or archive tickets."
    >
      <AdminSupportPanel requests={(requests as SupportRequest[]) ?? []} />
    </AdminShell>
  );
}
