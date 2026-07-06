"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";

interface SignInRequiredGateProps {
  redirectPath: string;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function SignInRequiredGate({
  redirectPath,
  title = "Sign in to continue",
  description = "Create a free account or sign in to access this page.",
  backHref = "/",
  backLabel = "Back to home",
}: SignInRequiredGateProps) {
  const encodedRedirect = encodeURIComponent(redirectPath);
  const signInHref = `/auth/sign-in?redirect=${encodedRedirect}`;
  const signUpHref = `/auth/sign-up?redirect=${encodedRedirect}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <Card
        variant="elevated"
        padding="lg"
        className="w-full max-w-md text-center space-y-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-required-title"
      >
        <h1 id="sign-in-required-title" className="text-2xl font-bold text-forest">
          {title}
        </h1>
        <p className="text-sm text-charcoal-light leading-relaxed">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <ButtonLink href={signUpHref} variant="primary" size="md">
            <UserPlus className="h-4 w-4" />
            Create account
          </ButtonLink>
          <ButtonLink href={signInHref} variant="outline" size="md">
            <LogIn className="h-4 w-4" />
            Sign in
          </ButtonLink>
        </div>
        <Link href={backHref} className="inline-block text-sm text-forest hover:underline">
          {backLabel}
        </Link>
      </Card>
    </div>
  );
}
