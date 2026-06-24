import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HostRequestActions } from "@/components/stays/HostRequestActions";
import { StayRequestStatusBadge } from "@/components/stays/StayRequestStatusBadge";
import { formatDateRange } from "@/lib/stay-requests";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { Profile, PublicListing, StayRequest } from "@/types/database";

export const metadata = { title: "Review Stay Request" };

export default async function HostRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?redirect=/host/requests/${id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as Pick<Profile, "role"> | null)?.role !== "host") {
    redirect("/profile/complete");
  }

  const { data: request } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!request) notFound();

  const typedRequest = request as StayRequest;

  const [{ data: listing }, { data: traveler }] = await Promise.all([
    typedRequest.listing_id
      ? supabase
          .from("public_listings")
          .select("title, budget_per_night")
          .eq("id", typedRequest.listing_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("full_name, bio, location").eq("id", typedRequest.traveler_id).single(),
  ]);

  const travelerProfile = traveler as { full_name: string | null; bio: string | null; location: string | null } | null;
  const listingData = listing as Pick<PublicListing, "title" | "budget_per_night"> | null;

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link href="/host/requests" className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" />
        All requests
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <StayRequestStatusBadge status={typedRequest.status} />
        <Badge variant="outline">From {travelerProfile?.full_name?.split(" ")[0] ?? "Traveler"}</Badge>
      </div>

      <h1 className="text-3xl font-bold text-forest mb-8">
        {listingData?.title ?? "Stay request"}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outline" padding="md">
            <h2 className="font-semibold text-forest mb-3">Traveler introduction</h2>
            <p className="text-charcoal-light whitespace-pre-wrap">{typedRequest.message}</p>
            {travelerProfile?.bio && (
              <p className="text-sm text-charcoal-light mt-4 pt-4 border-t border-sage-dark/30">
                <strong className="text-forest">Bio:</strong> {travelerProfile.bio}
              </p>
            )}
            {travelerProfile?.location && (
              <p className="text-sm text-charcoal-light mt-2">
                <strong className="text-forest">From:</strong> {travelerProfile.location}
              </p>
            )}
          </Card>

          <Card variant="outline" padding="md" className="space-y-3">
            <p className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-forest" />
              {formatDateRange(typedRequest.start_date, typedRequest.end_date)}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-forest" />
              {typedRequest.guest_count} guest{typedRequest.guest_count !== 1 ? "s" : ""}
            </p>
          </Card>
        </div>

        <HostRequestActions
          request={typedRequest}
          nightlyRate={listingData?.budget_per_night ?? null}
        />
      </div>
    </Container>
  );
}
