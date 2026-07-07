import { NextResponse } from "next/server";
import { recordLoginAudit } from "@/lib/record-login-audit";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { authMethod?: string };

  try {
    const result = await recordLoginAudit(body.authMethod ?? "password");
    return NextResponse.json(result);
  } catch (error) {
    console.error("record-login route failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
