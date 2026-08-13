import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HostSignalLibraryPanel } from "@/components/admin/host-finder/HostSignalLibraryPanel";
import { HostFinderSetupBanner } from "@/components/admin/host-finder/HostFinderSetupBanner";
import { isHostFinderSchemaReady } from "@/lib/host-finder/schema-ready";
import type { HostSignalLibraryEntry } from "@/lib/host-finder/types";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Host Signal Library",
  description: "High-intent phrases and concepts used for host discovery.",
  path: "/admin/host-growth/signals",
});

export default async function HostSignalLibraryPage() {
  const supabase = await createClient();
  const schemaReady = await isHostFinderSchemaReady(supabase);

  const { data: signals } = schemaReady
    ? await supabase
        .from("host_signal_library")
        .select("*")
        .order("intent_level", { ascending: true })
        .order("phrase", { ascending: true })
    : { data: [] };

  return (
    <AdminShell
      title="Signal Library"
      description="Behavioral signals Host Finder uses to identify people likely to host international travelers."
    >
      {!schemaReady ? (
        <HostFinderSetupBanner />
      ) : (
        <HostSignalLibraryPanel signals={(signals as HostSignalLibraryEntry[]) ?? []} />
      )}
    </AdminShell>
  );
}
