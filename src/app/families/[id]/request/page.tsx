import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RequestStayWizard } from "@/components/stays/RequestStayWizard";
import { TrackPageEvent } from "@/components/analytics/TrackPageEvent";
import { AnalyticsEvents } from "@/lib/analytics";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { PublicListing } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_listings")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ? `Request Stay — ${data.title}` : "Request Stay" };
}

export default async function RequestStayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase.from("public_listings").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!listing) notFound();

  const typedListing = listing as PublicListing;

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link
        href={`/families/${id}`}
        className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to family profile
      </Link>

      <div className="text-center mb-8">
        <Badge variant="gold" className="mb-4">Request Stay</Badge>
        <h1 className="text-3xl font-bold text-forest">Request to stay</h1>
        <p className="mt-2 text-charcoal-light">
          Introduce yourself, select dates, and submit your request to{" "}
          {typedListing.host_first_name ?? "this family"}.
        </p>
      </div>

      <TrackPageEvent
        event={AnalyticsEvents.REQUEST_START}
        data={{ listing_id: id }}
      />

      <RequestStayWizard listing={typedListing} userId={user?.id ?? null} />
    </Container>
  );
}
