import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Home,
  Shield,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import type { Profile, VerificationStatus } from "@/types/database";

export const metadata = {
  title: "Dashboard",
};

const statusLabels: Record<VerificationStatus, { label: string; variant: "default" | "success" | "warning" | "gold" | "outline" }> = {
  unverified: { label: "Not Verified", variant: "outline" },
  pending: { label: "Pending Review", variant: "warning" },
  in_review: { label: "In Review", variant: "gold" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Action Required", variant: "outline" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;
  const verification = typedProfile
    ? statusLabels[typedProfile.verification_status]
    : statusLabels.unverified;

  const onboardingSteps = [
    { label: "Create Account", done: true },
    { label: "Verify Email", done: !!user.email_confirmed_at },
    { label: "Complete Profile", done: !!typedProfile?.full_name },
    { label: "Verification", done: typedProfile?.verification_status === "verified" },
    { label: "Dashboard", done: typedProfile?.onboarding_complete ?? false },
  ];

  return (
    <Container className="py-16 md:py-24">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-forest">
          Welcome{typedProfile?.full_name ? `, ${typedProfile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-charcoal-light">
          Your {brand.name} journey starts here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Card variant="outline" padding="md">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-forest" />
            <h3 className="font-semibold text-forest">Trust Score</h3>
          </div>
          <p className="text-3xl font-bold text-forest">{typedProfile?.trust_score ?? 0}</p>
          <Link href="/trust-center/dashboard" className="block mt-4">
            <Button variant="secondary" size="sm" className="w-full">
              Trust Dashboard
            </Button>
          </Link>
        </Card>

        <Card variant="outline" padding="md">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-forest" />
            <h3 className="font-semibold text-forest">Verification</h3>
          </div>
          <Badge variant={verification.variant}>{verification.label}</Badge>
          {typedProfile?.verification_status !== "verified" && (
            <Link href="/verification-center" className="block mt-4">
              <Button variant="secondary" size="sm" className="w-full">
                Continue Verification
              </Button>
            </Link>
          )}
        </Card>

        <Card variant="outline" padding="md">
          <div className="flex items-center gap-3 mb-3">
            <Compass className="h-5 w-5 text-forest" />
            <h3 className="font-semibold text-forest">Role</h3>
          </div>
          <p className="text-charcoal-light capitalize">
            {typedProfile?.role || "Not set"}
          </p>
        </Card>

        <Card variant="outline" padding="md">
          <div className="flex items-center gap-3 mb-3">
            <Home className="h-5 w-5 text-forest" />
            <h3 className="font-semibold text-forest">Onboarding</h3>
          </div>
          <p className="text-charcoal-light capitalize">
            {typedProfile?.onboarding_step?.replace("_", " ") || "Not started"}
          </p>
        </Card>
      </div>

      <Card variant="elevated" padding="lg">
        <h2 className="text-xl font-semibold text-forest mb-6">Your Progress</h2>
        <div className="space-y-4">
          {onboardingSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-forest text-white"
                    : "bg-sage text-charcoal-light"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${step.done ? "text-forest" : "text-charcoal-light"}`}>
                  {step.label}
                </p>
              </div>
              {i < onboardingSteps.length - 1 && (
                <div className="hidden sm:block h-px flex-1 bg-sage-dark/30" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/trust-center/dashboard">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Trust Dashboard</h3>
                <p className="text-sm text-charcoal-light mt-1">Score, badges, and verification progress</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/settings/privacy">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Privacy Settings</h3>
                <p className="text-sm text-charcoal-light mt-1">Control your data and visibility</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/requests">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Stay Requests</h3>
                <p className="text-sm text-charcoal-light mt-1">Track pending and approved requests</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/trips">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">My Trips</h3>
                <p className="text-sm text-charcoal-light mt-1">Messaging, bookings, and payment</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/search">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Browse Families</h3>
                <p className="text-sm text-charcoal-light mt-1">Find your next host family</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/trust-center">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Trust Center</h3>
                <p className="text-sm text-charcoal-light mt-1">Learn how we keep you safe</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/verification-center">
          <Card variant="outline" padding="md" className="hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-forest">Verification Center</h3>
                <p className="text-sm text-charcoal-light mt-1">Complete your identity verification</p>
              </div>
              <ArrowRight className="h-5 w-5 text-charcoal-light group-hover:text-forest transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
