import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api-auth";
import { disconnectInstagram } from "@/lib/social-media/connection";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  try {
    await disconnectInstagram(auth.supabase);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Disconnect failed." },
      { status: 500 }
    );
  }
}
