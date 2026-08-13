import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { computeHostFinderAnalytics } from "@/lib/host-finder/analytics";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const analytics = await computeHostFinderAnalytics(auth.supabase);
  return NextResponse.json(analytics);
}
