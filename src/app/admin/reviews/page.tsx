import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewModerationPanel } from "@/components/reviews/ReviewModerationPanel";
import type { Review } from "@/types/database";

export const metadata = { title: "Admin — Reviews" };

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  return (
    <AdminShell title="Review Moderation" description="Approve or reject community reviews.">
      <ReviewModerationPanel reviews={(reviews as Review[]) ?? []} />
    </AdminShell>
  );
}
