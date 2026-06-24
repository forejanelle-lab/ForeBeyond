import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReviewModerationPanel } from "@/components/reviews/ReviewModerationPanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Profile, Review } from "@/types/database";

export const metadata = { title: "Review Moderation" };

export default async function ReviewModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/trust-center/reviews");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_trust_moderator")
    .eq("id", user.id)
    .single();

  if (!(profile as Pick<Profile, "is_trust_moderator"> | null)?.is_trust_moderator) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  return (
    <Container className="py-10 md:py-16">
      <Link
        href="/trust-center/dashboard"
        className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Trust dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Badge variant="gold">
          <Shield className="h-3 w-3" />
          Trust Center
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Review Moderation</h1>
      </div>

      <ReviewModerationPanel reviews={(reviews as Review[]) ?? []} />

      <div className="mt-8">
        <Link href="/trust-center/dashboard">
          <Button variant="outline" size="sm">Back to trust dashboard</Button>
        </Link>
      </div>
    </Container>
  );
}
