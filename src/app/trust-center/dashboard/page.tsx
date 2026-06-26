import { redirect } from "next/navigation";
import { Settings, Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { sampleImages } from "@/lib/sample-images";
import { PageHero } from "@/components/design/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { TrustScoreRing } from "@/components/trust/TrustScoreRing";
import { TrustScoreBreakdown } from "@/components/trust/TrustScoreBreakdown";
import { VerificationProgress } from "@/components/trust/VerificationProgress";
import { TrustBadges } from "@/components/trust/TrustBadges";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
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

  const [{ data: badges }, { data: documents }] = await Promise.all([
    supabase.from("trust_badges").select("*").eq("user_id", user.id),
    supabase.from("verification_documents").select("document_type, status").eq("user_id", user.id),
  ]);

  const docMap: Record<string, VerificationStatus> = {};
  (documents as Pick<VerificationDocument, "document_type" | "status">[] | null)?.forEach((d) => {
    docMap[d.document_type] = d.status;
  });

  const breakdown = (typedProfile?.trust_score_breakdown ?? {}) as Breakdown;
  const emailVerified = !!user.email_confirmed_at || !!typedProfile?.email_verified_at;
  const phoneVerified = !!typedProfile?.phone_verified_at;

  return (
    <>
      <PageHero
        image={sampleImages.trustCenter}
        imageAlt="Trust and safety at Fore Beyond"
        eyebrow="Trust Center"
        title="Your Trust Score"
        subtitle="Build trust through verification, completed stays, and community reviews."
        height="md"
      />

      <PageShell title="Trust Dashboard" subtitle="Score, badges, and verification progress">
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
            <ButtonLink href="/verification-center" variant="primary" size="sm" className="mt-4">
              Continue Verification
            </ButtonLink>
          </Card>

          <Card variant="outline" padding="lg">
            <h2 className="text-lg font-semibold text-forest mb-4">Trust Badges</h2>
            <TrustBadges badges={(badges as TrustBadge[]) ?? []} />
          </Card>
        </div>

        <Card variant="outline" padding="lg">
          <h2 className="text-lg font-semibold text-forest mb-2">Privacy & Data</h2>
          <p className="text-sm text-charcoal-light mb-4">
            Personal information stays hidden until a stay request is approved.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/settings/privacy" variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
              Privacy Settings
            </ButtonLink>
            <ButtonLink href="/settings/download-data" variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Download My Data
            </ButtonLink>
            <ButtonLink href="/settings/delete-account" variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete Account
            </ButtonLink>
          </div>
        </Card>
      </PageShell>
    </>
  );
}
