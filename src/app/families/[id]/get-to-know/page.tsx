import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GetToKnowFlow } from "@/components/get-to-know/GetToKnowFlow";
import { Container } from "@/components/ui/Container";
import { hostHasMessagedStayRequest, isStayMessagingOpen } from "@/lib/messaging";
import { resolveListingForProfilePage } from "@/lib/listing-profile-load";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import { privatePageMetadata } from "@/lib/site-metadata";
import type { Profile, StayRequest } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const listing = await resolveListingForProfilePage(supabase, id);
  const hostName = listing?.host_first_name ?? "this host";

  return privatePageMetadata({
    title: listing ? `Get to Know ${hostName}` : "Get to Know",
    description: `Discover what you might have in common with ${hostName} before requesting a stay.`,
    path: `/families/${id}/get-to-know`,
  });
}

export default async function GetToKnowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: { user } }, listing] = await Promise.all([
    supabase.auth.getUser(),
    resolveListingForProfilePage(supabase, id),
  ]);

  if (!listing) notFound();

  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", listing.host_id)
    .maybeSingle();

  const hostName = formatMemberDisplayName(
    (hostProfile as Pick<Profile, "full_name"> | null)?.full_name ?? listing.host_first_name,
    { fallback: "this host" }
  );
  const hostAvatarUrl =
    listing.host_avatar_url ??
    (hostProfile as Pick<Profile, "avatar_url"> | null)?.avatar_url ??
    null;

  let canMessageHost = false;
  let messageConversationId: string | null = null;

  if (user && user.id !== listing.host_id) {
    const { data: stayRequest } = await supabase
      .from("stay_requests")
      .select("id, status, end_date")
      .eq("traveler_id", user.id)
      .eq("listing_id", id)
      .in("status", ["pending", "host_approved", "approved"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (stayRequest) {
      const typedRequest = stayRequest as Pick<StayRequest, "id" | "status" | "end_date">;
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("stay_request_id", typedRequest.id)
        .maybeSingle();
      messageConversationId = (conversation as { id: string } | null)?.id ?? null;
      const hostHasMessaged =
        typedRequest.status === "pending"
          ? await hostHasMessagedStayRequest(supabase, typedRequest.id, listing.host_id)
          : false;
      canMessageHost = isStayMessagingOpen(typedRequest, {
        viewerIsHost: false,
        hostHasMessaged,
      });
    }
  }

  return (
    <Container className="py-8 md:py-12">
      <GetToKnowFlow
        listing={listing}
        hostName={hostName}
        hostAvatarUrl={hostAvatarUrl}
        canMessageHost={canMessageHost}
        messageConversationId={messageConversationId}
      />
    </Container>
  );
}
