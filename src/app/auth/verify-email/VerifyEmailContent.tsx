"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { ResendVerificationEmail } from "@/components/auth/ResendVerificationEmail";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import type { EmailOtpType } from "@supabase/supabase-js";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function checkVerification() {
      const supabase = createClient();

      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (!error) {
          setIsVerified(true);
          setIsChecking(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? "");

      if (user?.email_confirmed_at) {
        setIsVerified(true);
        setIsChecking(false);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user?.email_confirmed_at) {
            setIsVerified(true);
            setUserEmail(session.user.email ?? "");
            setIsChecking(false);
          }
        }
      );

      setIsChecking(false);
      return () => subscription.unsubscribe();
    }

    checkVerification();
  }, [searchParams]);

  if (isChecking) {
    return (
      <Container size="sm" className="py-16 md:py-24">
        <AuthBrandHeader />
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="flex justify-center mb-4">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
          <p className="text-charcoal-light">Checking verification status...</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" className="py-16 md:py-24">
      <AuthBrandHeader />
      <Card variant="elevated" padding="lg" className="text-center">
        {isVerified ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest/10">
                <CheckCircle2 className="h-8 w-8 text-forest" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-forest">Email verified!</h1>
            <p className="mt-3 text-charcoal-light">
              Your email has been confirmed. Let&apos;s complete your profile to get started.
            </p>
            <ButtonLink href="/profile/complete" variant="primary" size="lg" className="mt-8">
              Complete Your Profile
            </ButtonLink>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-forest">Waiting for verification</h1>
            <p className="mt-3 text-charcoal-light">
              Please check your email and click the verification link. This page will update
              automatically once verified.
            </p>
            <ResendVerificationEmail email={userEmail} showEmailField={!userEmail} />
            <ButtonLink href="/auth/resend-verification" variant="outline" size="md" className="mt-6">
              Resend to a different email
            </ButtonLink>
          </>
        )}
      </Card>
    </Container>
  );
}
