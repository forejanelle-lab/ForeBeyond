import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StayRequestCard } from "@/components/stays/StayRequestCard";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import type { Profile, PublicListing, StayRequest } from "@/types/database";

export const metadata = { title: "Stay Requests" };

export default async function HostRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/host/requests");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as Pick<Profile, "role"> | null)?.role !== "host") {
    redirect("/profile/complete");
  }

  const { data: requests } = await supabase
    .from("stay_requests")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const typedRequests = (requests as StayRequest[]) ?? [];
  const listingIds = [...new Set(typedRequests.map((r) => r.listing_id).filter(Boolean) as string[])];
  const travelerIds = [...new Set(typedRequests.map((r) => r.traveler_id))];

  const [{ data: listings }, { data: travelers }] = await Promise.all([
    listingIds.length > 0
      ? supabase.from("public_listings").select("id, title").in("id", listingIds)
      : Promise.resolve({ data: [] }),
    travelerIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", travelerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const listingMap = Object.fromEntries(
    ((listings as Pick<PublicListing, "id" | "title">[]) ?? []).map((l) => [l.id, l.title])
  );
  const travelerMap = Object.fromEntries(
    ((travelers as { id: string; full_name: string | null }[]) ?? []).map((t) => [
      t.id,
      t.full_name?.split(" ")[0] ?? "Traveler",
    ])
  );

  const pending = typedRequests.filter((r) => r.status === "pending");

  return (
    <Container className="py-10 md:py-16">
      <Badge variant="gold" className="mb-4">
        <Inbox className="h-3 w-3" />
        Incoming Requests
      </Badge>
      <h1 className="text-3xl font-bold text-forest">Stay requests</h1>
      <p className="mt-2 text-charcoal-light mb-8">
        {pending.length} pending · {typedRequests.length} total
      </p>

      {typedRequests.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-sage-dark/40 bg-sage/20">
          <p className="text-charcoal-light">No stay requests yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-forest mb-4">Pending review</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((request) => (
                  <StayRequestCard
                    key={request.id}
                    request={request}
                    listingTitle={request.listing_id ? listingMap[request.listing_id] : null}
                    otherPartyName={travelerMap[request.traveler_id]}
                    href={`/host/requests/${request.id}`}
                  />
                ))}
              </div>
            </section>
          )}

          {typedRequests.filter((r) => r.status !== "pending").length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-forest mb-4">Past requests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typedRequests
                  .filter((r) => r.status !== "pending")
                  .map((request) => (
                    <StayRequestCard
                      key={request.id}
                      request={request}
                      listingTitle={request.listing_id ? listingMap[request.listing_id] : null}
                      otherPartyName={travelerMap[request.traveler_id]}
                      href={`/host/requests/${request.id}`}
                    />
                  ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
