import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, traveler, host, documents, badges, privacy, trips, reviews] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("traveler_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("host_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("verification_documents").select("*").eq("user_id", user.id),
    supabase.from("trust_badges").select("*").eq("user_id", user.id),
    supabase.from("privacy_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("trips").select("*").or(`traveler_id.eq.${user.id},host_id.eq.${user.id}`),
    supabase.from("reviews").select("*").or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile: profile.data,
    traveler_profile: traveler.data,
    host_profile: host.data,
    verification_documents: documents.data,
    trust_badges: badges.data,
    privacy_settings: privacy.data,
    trips: trips.data,
    reviews: reviews.data,
  };

  await supabase.from("data_export_requests").insert({
    user_id: user.id,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  const json = JSON.stringify(exportData, null, 2);
  const base64 = Buffer.from(json).toString("base64");
  const downloadUrl = `data:application/json;base64,${base64}`;

  return NextResponse.json({ downloadUrl, exportedAt: exportData.exported_at });
}
