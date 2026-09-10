import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatAdminDateTime } from "@/lib/admin";
import { Badge } from "@/components/ui/Badge";
import type { ExitIntentInterest, ExitIntentLead } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Newsletter",
  description: "Emails captured from the Fore Beyond newsletter popup.",
  path: "/admin/newsletter",
});

const INTEREST_LABELS: Record<ExitIntentInterest, string> = {
  hosting: "Hosting",
  traveling: "Traveling",
  both: "Both",
};

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("exit_intent_leads")
    .select("id, email, interest, tag, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (leads as ExitIntentLead[]) ?? [];

  return (
    <AdminShell
      title="Newsletter popup"
      description={`${rows.length} ${rows.length === 1 ? "signup" : "signups"} from the exit-intent newsletter popup.`}
    >
      <AdminTable
        rows={rows}
        emptyMessage="No newsletter popup signups yet."
        columns={[
          {
            key: "email",
            label: "Email",
            render: (row) => (
              <a href={`mailto:${row.email}`} className="text-forest hover:underline">
                {row.email}
              </a>
            ),
          },
          {
            key: "interest",
            label: "Interest",
            render: (row) => <Badge variant="outline">{INTEREST_LABELS[row.interest]}</Badge>,
          },
          {
            key: "created_at",
            label: "Signed up",
            render: (row) => formatAdminDateTime(row.created_at),
          },
        ]}
      />
    </AdminShell>
  );
}
