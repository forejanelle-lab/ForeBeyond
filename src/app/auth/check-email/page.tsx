"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { ResendVerificationEmail } from "@/components/auth/ResendVerificationEmail";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const autoResend = searchParams.get("resend") === "1";
  const existing = searchParams.get("existing") === "1";

  return (
    <Container size="sm" className="py-16 md:py-24">
      <AuthBrandHeader />
      <Card variant="elevated" padding="lg" className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
            <Mail className="h-8 w-8 text-forest" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-forest">Check your email</h1>
        {existing ? (
          <p className="mt-3 text-charcoal-light leading-relaxed">
            An account with{" "}
            <span className="font-medium text-charcoal">{email || "this email"}</span> already
            exists but isn&apos;t verified yet. We can send a fresh verification link below.
          </p>
        ) : (
          <p className="mt-3 text-charcoal-light leading-relaxed">
            We sent a verification link to{" "}
            <span className="font-medium text-charcoal">{email || "your email"}</span>.
            Click the link to verify your account and continue.
          </p>
        )}

        <div className="mt-8 space-y-3">
          <ButtonLink href="/auth/verify-email" variant="primary" size="md" className="w-full">
            I&apos;ve verified my email
          </ButtonLink>
          <ButtonLink href="/auth/sign-in" variant="ghost" size="md" className="w-full">
            Back to sign in
          </ButtonLink>
        </div>

        <p className="mt-6 text-xs text-charcoal-light">
          Didn&apos;t receive the email? Check spam, or resend to the same address below.
          Look for a message from <span className="font-medium">hello@forebeyond.com</span>.
        </p>
        <ResendVerificationEmail
          email={email}
          autoSend={autoResend}
          showEmailField={!email}
        />
      </Card>
    </Container>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="py-16 text-center text-charcoal-light">
          Loading...
        </Container>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
