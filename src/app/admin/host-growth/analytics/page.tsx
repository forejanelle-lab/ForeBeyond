import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HostAnalyticsPanel } from "@/components/admin/host-finder/HostAnalyticsPanel";
import { HostFinderSetupBanner } from "@/components/admin/host-finder/HostFinderSetupBanner";
import { computeHostFinderAnalytics } from "@/lib/host-finder/analytics";
import { isHostFinderSchemaReady } from "@/lib/host-finder/schema-ready";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Host Acquisition Analytics",
  description: "Track host discovery and conversion metrics.",
  path: "/admin/host-growth/analytics",
});

export default async function HostAnalyticsPage() {
  const supabase = await createClient();
  const schemaReady = await isHostFinderSchemaReady(supabase);
  const analytics = schemaReady ? await computeHostFinderAnalytics(supabase) : null;

  return (
    <AdminShell
      wide
      title="Host Acquisition Analytics"
      description="Understand where your best hosts are coming from and how leads convert."
    >
      {!schemaReady || !analytics ? (
        <HostFinderSetupBanner />
      ) : (
        <HostAnalyticsPanel analytics={analytics} />
      )}
    </AdminShell>
  );
}
