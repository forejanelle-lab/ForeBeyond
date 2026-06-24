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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { DocumentType, VerificationStatus } from "@/types/database";

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
  {
    type: "background_check",
    title: "Background Check",
    description: "Consent to a background check (required for hosts).",
    icon: Shield,
    required: false,
    points: 0,
  },
];

const statusConfig: Record<VerificationStatus, { label: string; variant: "default" | "success" | "warning" | "gold" | "outline"; icon: typeof CheckCircle2 }> = {
  unverified: { label: "Not Started", variant: "outline", icon: AlertCircle },
  pending: { label: "Pending", variant: "warning", icon: Clock },
  in_review: { label: "In Review", variant: "gold", icon: Clock },
  verified: { label: "Verified", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Rejected", variant: "outline", icon: AlertCircle },
};

export default function VerificationCenterPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, VerificationStatus>>({});
  const [overallStatus, setOverallStatus] = useState<VerificationStatus>("unverified");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status, phone, phone_verified_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setOverallStatus(profile.verification_status);
        setPhone(profile.phone ?? "");
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
    }

    loadStatus();
  }, [router]);

  async function handleSubmitDocument(type: DocumentType) {
    setSubmitting(type);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("verification_documents").upsert(
      { user_id: user.id, document_type: type, status: "pending" },
      { onConflict: "user_id,document_type" }
    );

    if (!error) {
      setDocuments((prev) => ({ ...prev, [type]: "pending" }));
    }

    setSubmitting(null);
  }

  async function handlePhoneVerify() {
    if (!phone.trim()) return;
    setSubmitting("phone_verification");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      phone: phone.trim(),
      phone_verified_at: new Date().toISOString(),
    }).eq("id", user.id);

    await supabase.from("verification_documents").upsert(
      { user_id: user.id, document_type: "phone_verification", status: "verified" },
      { onConflict: "user_id,document_type" }
    );

    setDocuments((prev) => ({ ...prev, phone_verification: "verified" }));
    setSubmitting(null);
  }

  async function handleCompleteOnboarding() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        onboarding_complete: true,
        onboarding_step: "complete",
        verification_status: "pending",
        email_verified_at: user.email_confirmed_at ?? new Date().toISOString(),
      })
      .eq("id", user.id);

    trackEvent(AnalyticsEvents.VERIFICATION_COMPLETION);

    router.push("/trust-center/dashboard");
  }

  const requiredComplete = verificationSteps
    .filter((s) => s.required)
    .every((s) => documents[s.type] && documents[s.type] !== "unverified");

  if (isLoading) {
    return (
      <Container className="py-16 md:py-24">
        <div className="flex justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      </Container>
    );
  }

  const overall = statusConfig[overallStatus];

  return (
    <Container size="md" className="py-16 md:py-24">
      <div className="text-center mb-10">
        <Badge variant="gold" className="mb-4">
          <Shield className="h-3 w-3" />
          Verification Center
        </Badge>
        <h1 className="text-3xl font-bold text-forest">Verification Workflows</h1>
        <p className="mt-2 text-charcoal-light max-w-lg mx-auto">
          Each step increases your Trust Score. Complete verifications to unlock the full platform.
        </p>
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          <Badge variant={overall.variant}>
            <overall.icon className="h-3 w-3" />
            Overall: {overall.label}
          </Badge>
          <Link href="/trust-center/dashboard">
            <Badge variant="outline">View Trust Dashboard →</Badge>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {verificationSteps.map((step) => {
          const status = documents[step.type] || "unverified";
          const config = statusConfig[status];

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

                  {step.type === "phone_verification" && status === "unverified" && (
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
                {status === "unverified" && step.type !== "phone_verification" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSubmitDocument(step.type)}
                    isLoading={submitting === step.type}
                  >
                    <Upload className="h-4 w-4" />
                    Submit
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {requiredComplete && (
        <div className="mt-8 text-center">
          <Button variant="primary" size="lg" onClick={handleCompleteOnboarding}>
            Complete &amp; Go to Trust Dashboard
          </Button>
          <p className="mt-3 text-sm text-charcoal-light">
            Your documents will be reviewed within 24-48 hours.
          </p>
        </div>
      )}
    </Container>
  );
}
