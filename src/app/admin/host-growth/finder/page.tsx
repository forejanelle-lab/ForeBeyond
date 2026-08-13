import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { HostFinderPanel } from "@/components/admin/host-finder/HostFinderPanel";
import { HostFinderSetupBanner } from "@/components/admin/host-finder/HostFinderSetupBanner";
import { isSearchProviderConfigured, getSearchProviderLabel } from "@/lib/host-finder/providers";
import { isHostFinderSchemaReady } from "@/lib/host-finder/schema-ready";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Host Finder",
  description: "Discover potential Fore Beyond hosts from publicly available information.",
  path: "/admin/host-growth/finder",
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HostFinderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const searchId = typeof params.search === "string" ? params.search : undefined;
  const supabase = await createClient();
  const schemaReady = await isHostFinderSchemaReady(supabase);

  return (
    <AdminShell
      wide
      title="Host Finder"
      description="Discover people on the public internet most likely to become your next Fore Beyond host."
    >
      {!schemaReady ? (
        <HostFinderSetupBanner />
      ) : (
        <HostFinderPanel
          initialSearchId={searchId}
          configured={isSearchProviderConfigured()}
          openAiConfigured={Boolean(process.env.OPENAI_API_KEY?.trim())}
          provider={getSearchProviderLabel()}
        />
      )}
    </AdminShell>
  );
}
