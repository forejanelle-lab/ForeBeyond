import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { loadSearchWithLeads } from "@/lib/host-finder/run-search";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await loadSearchWithLeads(auth.supabase, id);

  if (!result) {
    return NextResponse.json({ error: "Search not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
