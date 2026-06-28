import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GuestTrustProfile } from "@/components/stays/GuestTrustProfile";
import { Container } from "@/components/ui/Container";
import { formatMemberDisplayName } from "@/lib/member-display-name";
import {
  hostHasGuestRequest,
  pickGuestNameRevealStatus,
} from "@/lib/host-guest-access";
import type { Profile, PublicReview, StayRequest, TrustBadge } from "@/types/database";

export async function generateMetadata() {
  return { title: "Guest profile" };
}

export default async function HostGuestProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ request?: string }>;
}) {
  const { id: guestId } = await params;
  const { request: requestId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?redirect=/host/guests/${guestId}`);
  }

  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((hostProfile as Pick<Profile, "role"> | null)?.role !== "host") {
    redirect("/profile/complete");
  }

  const canView = await hostHasGuestRequest(supabase, user.id, guestId);
  if (!canView) notFound();

  const [{ data: guestProfile }, { data: guestRequests }, { data: badges }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, bio, location, languages, avatar_url, trust_score, trust_score_breakdown, profile_completion, verification_status, role, created_at"
        )
        .eq("id", guestId)
        .single(),
      supabase
        .from("stay_requests")
        .select("id, status")
        .eq("host_id", user.id)
        .eq("traveler_id", guestId)
        .order("created_at", { ascending: false }),
      supabase.from("trust_badges").select("*").eq("user_id", guestId),
      supabase
        .from("public_reviews")
        .select("*")
        .eq("reviewee_id", guestId)
        .eq("reviewer_role", "host")
        .order("created_at", { ascending: false }),
    ]);

  if (!guestProfile) notFound();

  const typedGuest = guestProfile as Pick<
    Profile,
    | "full_name"
    | "bio"
    | "location"
    | "languages"
    | "avatar_url"
    | "trust_score"
    | "trust_score_breakdown"
    | "profile_completion"
    | "verification_status"
    | "role"
    | "created_at"
  >;

  const requests = (guestRequests as Pick<StayRequest, "id" | "status">[]) ?? [];
  const contextRequest = requestId
    ? requests.find((r) => r.id === requestId) ?? null
    : requests[0] ?? null;
  const nameRevealStatus = contextRequest?.status ?? pickGuestNameRevealStatus(requests);
  const displayName = formatMemberDisplayName(typedGuest.full_name, {
    fallback: "Guest",
    stayStatus: nameRevealStatus,
  });

  const backHref = contextRequest
    ? `/host/requests/${contextRequest.id}`
    : "/host/requests";
  const backLabel = contextRequest ? "Back to request" : "Back to requests";

  return (
    <Container size="md" className="py-10 md:py-16">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-forest hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <p className="text-sm text-charcoal-light mb-2">Guest trust profile</p>
      <GuestTrustProfile
        displayName={displayName}
        profile={typedGuest}
        badges={(badges as TrustBadge[]) ?? []}
        reviews={(reviews as PublicReview[]) ?? []}
      />
    </Container>
  );
}
