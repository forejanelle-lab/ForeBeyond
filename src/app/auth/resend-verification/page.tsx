"use client";

import { Suspense } from "react";
import { Mail } from "lucide-react";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { ResendVerificationEmail } from "@/components/auth/ResendVerificationEmail";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

export default function ResendVerificationPage() {
  return (
    <Container size="sm" className="py-16 md:py-24">
      <AuthBrandHeader />
      <Card variant="elevated" padding="lg">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
            <Mail className="h-8 w-8 text-forest" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-forest text-center">Resend verification</h1>
        <p className="mt-3 text-charcoal-light text-center leading-relaxed">
          Enter the same email you used to sign up. We&apos;ll send a new link that works on your
          phone or computer.
        </p>

        <Suspense>
          <ResendVerificationEmail showEmailField autoSend={false} />
        </Suspense>

        <div className="mt-6 pt-6 border-t border-sage-dark/30 text-center">
          <ButtonLink href="/auth/sign-in" variant="ghost" size="md">
            Back to sign in
          </ButtonLink>
        </div>
      </Card>
    </Container>
  );
}
