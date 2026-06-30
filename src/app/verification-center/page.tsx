"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Camera,
  FileText,
  MapPin,
  Phone,
  Video,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { getProfileVerificationStatusLabel } from "@/lib/verification-labels";
import { getHostListingId, hostListingManagePath } from "@/lib/host-listing-limit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageShell } from "@/components/layout/PageShell";
import { TrustScorePanel } from "@/components/design/TrustScorePanel";
import { VerificationSubmitModal } from "@/components/verification/VerificationSubmitModal";
import type { DocumentType, UserRole, VerificationStatus } from "@/types/database";

interface VerificationStep {
  type: DocumentType;
  title: string;
  description: string;
  icon: typeof Shield;
  required: boolean;
  points: number;
}

const verificationSteps: VerificationStep[] = [
  {
    type: "phone_verification",
    title: "Phone Verification",
    description: "Verify your phone number to build trust with hosts and travelers.",
    icon: Phone,
    required: true,
    points: 10,
  },
  {
    type: "government_id",
    title: "Government ID",
    description: "Upload a valid passport, driver's license, or national ID card.",
    icon: FileText,
    required: true,
    points: 15,
  },
  {
    type: "selfie",
    title: "Selfie Verification",
    description: "Take a live selfie to confirm your identity matches your ID.",
    icon: Camera,
    required: true,
    points: 0,
  },
  {
    type: "address_proof",
    title: "Address Verification",
    description: "Utility bill or bank statement showing your current address.",
    icon: MapPin,
    required: false,
    points: 10,
  },
  {
    type: "video_verification",
    title: "Video Verification",
    description: "Record a short video saying your name to confirm identity.",
    icon: Video,
    required: false,
    points: 15,
  },
];

const statusConfig: Record<
  VerificationStatus,
  { label: string; variant: "default" | "success" | "warning" | "gold" | "outline"; icon: typeof CheckCircle2 }
> = {
  unverified: { label: "Not Started", variant: "outline", icon: AlertCircle },
  pending: { label: "Submitted", variant: "warning", icon: Clock },
  in_review: { label: "In Review", variant: "gold", icon: Clock },
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Needs resubmission", variant: "outline", icon: AlertCircle },
};

export default function VerificationCenterPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, VerificationStatus>>({});
  const [overallStatus, setOverallStatus] = useState<VerificationStatus>("unverified");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [trustScore, setTrustScore] = useState(0);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<VerificationStep | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  async function loadStatus() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsLoading(false);
      router.push("/auth/sign-in?redirect=/verification-center");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, phone, phone_verified_at, trust_score, role, onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile) {
      setOverallStatus(profile.verification_status);
      setPhone(profile.phone ?? "");
      setTrustScore(profile.trust_score ?? 0);
      setUserRole(profile.role);
      setOnboardingComplete(profile.onboarding_complete ?? false);
      if (profile.phone_verified_at) {
        setDocuments((prev) => ({ ...prev, phone_verification: "verified" }));
      }
    }

    const { data: docs } = await supabase
      .from("verification_documents")
      .select("document_type, status")
      .eq("user_id", user.id);

    if (docs) {
      const docMap: Record<string, VerificationStatus> = {};
      docs.forEach((doc) => {
        docMap[doc.document_type] = doc.status;
      });
      setDocuments((prev) => ({ ...prev, ...docMap }));
    }

    setIsLoading(false);
    router.refresh();
  }

  useEffect(() => {
    loadStatus();
  }, [router]);

  async function handlePhoneVerify() {
    if (!phone.trim()) return;
    setSubmitting("phone_verification");
    setErrorMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        phone: phone.trim(),
        phone_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const { error: docError } = await supabase.from("verification_documents").upsert(
      { user_id: user.id, document_type: "phone_verification", status: "verified" },
      { onConflict: "user_id,document_type" }
    );

    if (profileError || docError) {
      setErrorMessage(profileError?.message ?? docError?.message ?? "Phone verification failed.");
      setSubmitting(null);
      return;
    }

    setDocuments((prev) => ({ ...prev, phone_verification: "verified" }));
    setSuccessMessage("Phone number verified.");
    setSubmitting(null);
    await loadStatus();
  }

  async function handleCompleteOnboarding() {
    setIsFinishing(true);
    setErrorMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (userRole === "host") {
      const existingListingId = await getHostListingId(supabase, user.id);
      window.location.assign(hostListingManagePath(existingListingId));
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_complete: true,
        onboarding_step: "complete",
        verification_status: overallStatus === "unverified" ? "pending" : overallStatus,
        email_verified_at: user.email_confirmed_at ?? new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setErrorMessage(error.message);
      setIsFinishing(false);
      return;
    }

    trackEvent(AnalyticsEvents.VERIFICATION_COMPLETION);
    window.location.assign("/search");
  }

  function handleDocumentSubmitted(type: DocumentType) {
    const wasRejected = documents[type] === "rejected";
    setDocuments((prev) => ({ ...prev, [type]: "pending" }));
    if (overallStatus === "rejected") {
      setOverallStatus("pending");
    }
    const step = verificationSteps.find((s) => s.type === type);
    setSuccessMessage(
      `${step?.title ?? "Document"} ${wasRejected ? "resubmitted" : "submitted"} for review.`
    );
    setErrorMessage("");
    loadStatus();
  }

  const requiredComplete = verificationSteps
    .filter((s) => s.required)
    .every((s) => {
      const docStatus = documents[s.type];
      return (
        docStatus &&
        docStatus !== "unverified" &&
        docStatus !== "rejected"
      );
    });

  const hasRejectedDocs = verificationSteps.some(
    (s) => documents[s.type] === "rejected"
  );

  const canContinueOnboarding = !onboardingComplete;
  const isHost = userRole === "host";
  const showContinueButton = isHost || canContinueOnboarding || requiredComplete;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  const overall = {
    label: getProfileVerificationStatusLabel(overallStatus),
    variant: statusConfig[overallStatus].variant,
    icon: statusConfig[overallStatus].icon,
  };

  return (
    <PageShell
      title="Verification Checklist"
      subtitle={`Overall status: ${overall.label}`}
    >
      {successMessage && (
        <div className="mb-6 rounded-xl bg-forest/10 border border-forest/20 px-4 py-3 text-sm text-forest">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      {hasRejectedDocs && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-charcoal">
          Verification is incomplete. Update the items marked below and submit again.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {verificationSteps.map((step) => {
            const status = documents[step.type] || "unverified";
            const config = statusConfig[status];
            const canSubmit = status === "unverified" || status === "rejected";

            return (
              <Card key={step.type} variant="outline" padding="md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-forest">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-forest">{step.title}</h3>
                      {step.required && <Badge variant="outline">Required</Badge>}
                      {step.points > 0 && <Badge variant="gold">+{step.points} pts</Badge>}
                      <Badge variant={config.variant}>
                        <config.icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-charcoal-light">{step.description}</p>

                    {step.type === "phone_verification" &&
                      (status === "unverified" || status === "rejected") && (
                      <div className="mt-3 flex gap-2">
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="flex-1"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handlePhoneVerify}
                          isLoading={submitting === "phone_verification"}
                        >
                          Verify
                        </Button>
                      </div>
                    )}
                  </div>
                  {canSubmit && step.type !== "phone_verification" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveStep(step)}
                    >
                      <Upload className="h-4 w-4" />
                      {status === "rejected" ? "Resubmit" : "Submit"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <TrustScorePanel score={trustScore} compact showBreakdownLink />
          {userRole && (
            <Card variant="outline" padding="md" className="space-y-3">
              <p className="text-sm font-medium text-forest">Next step</p>
              <p className="text-sm text-charcoal-light">
                {isHost
                  ? "Create your family listing. You can finish verification items anytime."
                  : canContinueOnboarding
                    ? "Continue to search families. You can finish remaining verification items anytime."
                    : requiredComplete
                      ? "Find a host family that fits your journey."
                      : "Finish phone, ID, and selfie verification above to unlock Search Families."}
              </p>
            </Card>
          )}
          <Link href="/trust-center/dashboard" className="block text-center text-sm text-forest hover:underline">
            View Trust Dashboard →
          </Link>
        </div>
      </div>

      {showContinueButton && (
        <div className="mt-8 text-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCompleteOnboarding}
            isLoading={isFinishing}
          >
            {isHost
              ? "Continue — Create Your Listing"
              : canContinueOnboarding && !requiredComplete
                ? "Continue — Search Families"
                : "Next — Search Families"}
          </Button>
          <p className="mt-3 text-sm text-charcoal-light">
            {isHost
              ? "Verification is separate from onboarding — complete your listing now and return here anytime."
              : canContinueOnboarding && !requiredComplete
                ? "You can complete ID and selfie verification later from this page or your Trust Dashboard."
                : "Browse verified host families and send your first stay request. Your documents stay in review."}
          </p>
        </div>
      )}

      <VerificationSubmitModal
        open={!!activeStep}
        documentType={activeStep?.type ?? null}
        title={activeStep?.title ?? ""}
        description={activeStep?.description ?? ""}
        onClose={() => setActiveStep(null)}
        onSubmitted={() => {
          if (activeStep) handleDocumentSubmitted(activeStep.type);
        }}
      />
    </PageShell>
  );
}
