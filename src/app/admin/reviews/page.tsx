import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewModerationPanel } from "@/components/reviews/ReviewModerationPanel";
import type { Review } from "@/types/database";
import { privatePageMetadata } from "@/lib/site-metadata";

export const metadata = privatePageMetadata({
  title: "Admin — Reviews",
  description: "Moderate reviews in Fore Beyond admin.",
  path: "/admin/reviews",
});

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
