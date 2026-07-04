import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

interface ListingAccessGateProps {
  listingId: string;
}

export function ListingAccessGate({ listingId }: ListingAccessGateProps) {
  const redirect = `/families/${listingId}`;
  const signInHref = `/auth/sign-in?redirect=${encodeURIComponent(redirect)}`;
  const signUpHref = `/auth/sign-up?redirect=${encodeURIComponent(redirect)}`;

  return (
    <Container size="sm" className="py-16 md:py-24">
      <Card variant="elevated" padding="lg" className="text-center space-y-5">
        <h1 className="text-2xl font-bold text-forest">Sign in to view this host family</h1>
        <p className="text-sm text-charcoal-light leading-relaxed max-w-md mx-auto">
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
          Browse host families
        </Link>
      </Card>
    </Container>
  );
}
