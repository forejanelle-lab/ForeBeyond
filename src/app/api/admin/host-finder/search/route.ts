import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { runHostSearch } from "@/lib/host-finder/run-search";
import type { HostFinderHostType } from "@/lib/host-finder/types";
import { isSearchProviderConfigured, getSearchProviderLabel } from "@/lib/host-finder/providers";

export const maxDuration = 300;

interface SearchBody {
  country?: string;
  region?: string;
  hostType?: HostFinderHostType;
  leadsRequested?: number;
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required for Host Finder qualification." },
      { status: 503 }
    );
  }

  if (!isSearchProviderConfigured()) {
    return NextResponse.json(
      { error: "Search provider is not configured. Set HOST_FINDER_SEARCH_PROVIDER and HOST_FINDER_SEARCH_API_KEY." },
      { status: 503 }
    );
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const country = body.country?.trim();
  if (!country) {
    return NextResponse.json({ error: "Country is required." }, { status: 400 });
  }

  const leadsRequested = Math.min(Math.max(body.leadsRequested ?? 20, 1), 100);
  const hostType = body.hostType ?? "experienced_cultural_exchange_host";

  try {
    const result = await runHostSearch(auth.supabase, {
      country,
      region: body.region?.trim() || undefined,
      hostType,
      leadsRequested,
      createdBy: auth.user.id,
    });

    return NextResponse.json({
      search: result.search,
      leads: result.leads,
      provider: getSearchProviderLabel(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { data } = await auth.supabase
    .from("host_searches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({
    searches: data ?? [],
    provider: getSearchProviderLabel(),
    configured: isSearchProviderConfigured(),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  });
}
