import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Settings, Download, Trash2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { TrustScoreBreakdown } from "@/components/trust/TrustScoreBreakdown";
import { VerificationProgress } from "@/components/trust/VerificationProgress";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { Profile, TrustBadge, VerificationDocument, VerificationStatus } from "@/types/database";
import type { TrustScoreBreakdown as Breakdown } from "@/lib/trust-score";

export const metadata = { title: "Trust Dashboard" };

export default async function TrustDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?redirect=/trust-center/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;
  const isModerator = typedProfile?.is_trust_moderator ?? false;

  const { data: badges } = await supabase
    .from("trust_badges")
    .select("*")
    .eq("user_id", user.id);

  const { data: documents } = await supabase
    .from("verification_documents")
    .select("document_type, status")
    .eq("user_id", user.id);

  const docMap: Record<string, VerificationStatus> = {};
  (documents as Pick<VerificationDocument, "document_type" | "status">[] | null)?.forEach((d) => {
    docMap[d.document_type] = d.status;
  });

  const breakdown = (typedProfile?.trust_score_breakdown ?? {}) as Breakdown;
  const emailVerified = !!user.email_confirmed_at || !!typedProfile?.email_verified_at;
  const phoneVerified = !!typedProfile?.phone_verified_at;

  return (
    <Container className="py-16 md:py-24">
      <div className="mb-10">
        <Badge variant="gold" className="mb-4">
          <Shield className="h-3 w-3" />
          Trust Dashboard
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Your Trust Score</h1>
        <p className="mt-2 text-charcoal-light">
          Build trust through verification, completed stays, and community reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card variant="elevated" padding="lg" className="flex flex-col items-center justify-center">
          <TrustScoreRing score={typedProfile?.trust_score ?? 0} size="lg" />
          <p className="mt-4 text-sm text-charcoal-light text-center">
            Profile {typedProfile?.profile_completion ?? 0}% complete
          </p>
        </Card>

        <Card variant="outline" padding="lg" className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-forest mb-4">Score Breakdown</h2>
          <TrustScoreBreakdown breakdown={breakdown} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card variant="outline" padding="lg">
          <h2 className="text-lg font-semibold text-forest mb-4">Verification Progress</h2>
          <VerificationProgress
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            documentStatuses={docMap}
          />
          <Link href="/verification-center" className="inline-block mt-4">
            <Button variant="primary" size="sm">Continue Verification</Button>
          </Link>
        </Card>

        <Card variant="outline" padding="lg">
          <h2 className="text-lg font-semibold text-forest mb-4">Trust Badges</h2>
          <TrustBadges badges={(badges as TrustBadge[]) ?? []} />
        </Card>
      </div>

      <Card variant="outline" padding="lg">
        <h2 className="text-lg font-semibold text-forest mb-2">Privacy & Data</h2>
        <p className="text-sm text-charcoal-light mb-4">
          Personal information stays hidden until a stay request is approved. Manage your privacy below.
        </p>
        <div className="flex flex-wrap gap-3">
          {isModerator && (
            <Link href="/trust-center/reviews">
              <Button variant="gold" size="sm">
                <Star className="h-4 w-4" />
                Review Moderation
              </Button>
            </Link>
          )}
          <Link href="/settings/privacy">
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
              Privacy Settings
            </Button>
          </Link>
          <Link href="/settings/download-data">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Download My Data
            </Button>
          </Link>
          <Link href="/settings/delete-account">
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </Link>
        </div>
      </Card>

      <p className="mt-6 text-xs text-charcoal-light text-center">
        {brand.name} — trust-first cultural immersion. Your data is protected until you choose to connect.
      </p>
    </Container>
  );
}
