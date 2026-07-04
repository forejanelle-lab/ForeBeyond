"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import {
  hostListingSignInPath,
  hostListingSignUpPath,
} from "@/lib/listing-access";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";

interface ListingAuthGateProps {
  listingId: string;
  children: ReactNode;
}

export function ListingAuthGate({ listingId, children }: ListingAuthGateProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const signInHref = hostListingSignInPath(listingId);
  const signUpHref = hostListingSignUpPath(listingId);

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 select-none overflow-hidden blur-xl brightness-[0.72] contrast-75 saturate-50"
        aria-hidden
      >
        {children}
      </div>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-auth-gate-title"
      >
        <Card variant="elevated" padding="lg" className="w-full max-w-md text-center space-y-5 shadow-xl">
          <h1 id="listing-auth-gate-title" className="text-2xl font-bold text-forest">
            Sign in to view this host family
          </h1>
          <p className="text-sm text-charcoal-light leading-relaxed">
            Create a free account or sign in to see the full listing, save families, and request a
            stay.
          </p>
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
          <Link href="/search" className="inline-block text-sm text-forest hover:underline">
            Back to search
          </Link>
        </Card>
      </div>
    </div>
  );
}
