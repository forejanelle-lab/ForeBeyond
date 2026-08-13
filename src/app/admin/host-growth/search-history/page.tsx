import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HostSearchHistoryPanel } from "@/components/admin/host-finder/HostSearchHistoryPanel";
import { HostFinderSetupBanner } from "@/components/admin/host-finder/HostFinderSetupBanner";
import { isHostFinderSchemaReady } from "@/lib/host-finder/schema-ready";
import type { HostSearch } from "@/lib/host-finder/types";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Host Finder Search History",
  description: "Review past Host Finder searches and reopen results.",
  path: "/admin/host-growth/search-history",
});

export default async function HostSearchHistoryPage() {
  const supabase = await createClient();
  const schemaReady = await isHostFinderSchemaReady(supabase);

  const { data: searches } = schemaReady
    ? await supabase
        .from("host_searches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <AdminShell
      title="Search History"
      description="Review past Host Finder searches and reopen previous results."
    >
      {!schemaReady ? (
        <HostFinderSetupBanner />
      ) : (
        <HostSearchHistoryPanel searches={(searches as HostSearch[]) ?? []} />
      )}
    </AdminShell>
  );
}
