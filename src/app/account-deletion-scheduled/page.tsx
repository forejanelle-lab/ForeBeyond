import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function AccountDeletionScheduledPage() {
  return (
    <Container size="sm" className="py-16 md:py-24">
      <Card variant="elevated" padding="lg" className="text-center">
        <h1 className="text-2xl font-bold text-forest">Account deletion scheduled</h1>
        <p className="mt-3 text-charcoal-light">
          Your account will be permanently deleted in 7 days. You have been signed out.
        </p>
        <ButtonLink href="/" variant="primary" size="md" className="mt-6">
          Return home
        </ButtonLink>
        <p className="mt-4 text-sm text-charcoal-light">
          Changed your mind?{" "}
          <Link href="/auth/sign-in" className="text-forest font-medium hover:underline">
            Sign in again
          </Link>{" "}
          before the grace period ends.
        </p>
      </Card>
    </Container>
  );
}
