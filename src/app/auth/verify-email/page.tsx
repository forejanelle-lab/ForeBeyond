"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function VerifyEmailPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkVerification() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        setIsVerified(true);
        setIsChecking(false);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user?.email_confirmed_at) {
            setIsVerified(true);
            setIsChecking(false);
          }
        }
      );

      setIsChecking(false);
      return () => subscription.unsubscribe();
    }

    checkVerification();
  }, []);

  if (isChecking) {
    return (
      <Container size="sm" className="py-16 md:py-24">
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
            <Link href="/profile/complete" className="inline-block mt-8">
              <Button variant="primary" size="lg">
                Complete Your Profile
              </Button>
            </Link>
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
              Please check your email and click the verification link. This page will update automatically.
            </p>
            <Link href="/auth/check-email" className="inline-block mt-8">
              <Button variant="outline" size="md">
                Back to check email
              </Button>
            </Link>
          </>
        )}
      </Card>
    </Container>
  );
}
