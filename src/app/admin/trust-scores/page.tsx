import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTrustScorePanel } from "@/components/admin/AdminTrustScorePanel";
import type { Profile } from "@/types/database";

export const metadata = { title: "Admin — Trust Scores" };

export default async function AdminTrustScoresPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, trust_score, verification_status")
    .order("trust_score", { ascending: false })
    .limit(50);

  return (
    <AdminShell title="Trust Scores" description="Monitor and recalculate member trust scores.">
      <AdminTrustScorePanel
        users={
          (users as Pick<
            Profile,
            "id" | "full_name" | "email" | "role" | "trust_score" | "verification_status"
          >[]) ?? []
        }
      />
    </AdminShell>
  );
}
