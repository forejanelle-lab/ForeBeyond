import { redirect } from "next/navigation";
import { Inbox, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StayRequestCard } from "@/components/stays/StayRequestCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import type { PublicListing, StayRequest } from "@/types/database";

export const metadata = { title: "Pending Requests" };

export default async function TravelerRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/dashboard/requests");

  const { data: requests } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  const typedRequests = (requests as StayRequest[]) ?? [];
  const listingIds = [...new Set(typedRequests.map((r) => r.listing_id).filter(Boolean) as string[])];
  const hostIds = [...new Set(typedRequests.map((r) => r.host_id))];

  const [{ data: listings }, { data: hosts }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("public_listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    hostIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", hostIds)
      : Promise.resolve({ data: [] }),
  ]);

  const listingMap = Object.fromEntries(
    ((listings as Pick<PublicListing, "id" | "title">[]) ?? []).map((l) => [l.id, l.title])
  );
  const hostMap = Object.fromEntries(
    ((hosts as { id: string; full_name: string | null }[]) ?? []).map((h) => [
      h.id,
      h.full_name?.split(" ")[0] ?? "Host",
    ])
  );

  const pendingCount = typedRequests.filter((r) => r.status === "pending").length;

  return (
    <Container className="py-10 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <Badge variant="gold" className="mb-4">
            <Inbox className="h-3 w-3" />
            Pending Requests
          </Badge>
          <h1 className="text-3xl font-bold text-forest">My requests</h1>
          <p className="mt-2 text-charcoal-light">
            {typedRequests.length} total · {pendingCount} pending
          </p>
        </div>
        <ButtonLink href="/search" variant="secondary" size="md">
          <Search className="h-4 w-4" />
          Browse families
        </ButtonLink>
      </div>

      {typedRequests.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <p className="text-charcoal-light mb-4">You haven&apos;t sent any requests yet.</p>
          <ButtonLink href="/search" variant="primary" size="lg">
            <Search className="h-4 w-4" />
            Find a host family
          </ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {typedRequests.map((request) => (
            <StayRequestCard
              key={request.id}
              request={request}
              listingTitle={request.listing_id ? listingMap[request.listing_id] : null}
              otherPartyName={hostMap[request.host_id]}
              href={`/dashboard/requests/${request.id}`}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
