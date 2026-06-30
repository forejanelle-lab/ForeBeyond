import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminVerificationPanel } from "@/components/admin/AdminVerificationPanel";
import type { Profile, VerificationDocument } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Verifications",
  description: "Verification queue in Fore Beyond admin.",
  path: "/admin/verifications",
});

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("verification_documents")
    .select("*")
    .in("status", ["pending", "in_review"])
    .order("created_at", { ascending: true })
    .limit(50);

  const typedDocs = (documents as VerificationDocument[]) ?? [];
  const userIds = [...new Set(typedDocs.map((d) => d.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles as Pick<Profile, "id" | "full_name" | "email">[] | null)?.map((p) => [p.id, p]) ?? []
  );

  const rows = typedDocs.map((doc) => ({
    ...doc,
    user_name: profileMap.get(doc.user_id)?.full_name ?? null,
    user_email: profileMap.get(doc.user_id)?.email ?? null,
    user_id: doc.user_id,
  }));

  return (
    <AdminShell
      wide
      title="Verification Requests"
      description="Review identity and trust documents grouped by member."
    >
      <AdminVerificationPanel documents={rows} />
    </AdminShell>
  );
}
