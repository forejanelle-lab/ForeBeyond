import { Suspense } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";

function CheckEmailContent({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email || "your email";

  return (
    <Container size="sm" className="py-16 md:py-24">
      <Card variant="elevated" padding="lg" className="text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage">
            <Mail className="h-8 w-8 text-forest" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-forest">Check your email</h1>
        <p className="mt-3 text-charcoal-light leading-relaxed">
          We sent a verification link to{" "}
          <span className="font-medium text-charcoal">{email}</span>.
          Click the link to verify your account and continue.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/auth/verify-email">
            <Button variant="primary" size="md" className="w-full">
              I&apos;ve verified my email
            </Button>
          </Link>
          <Link href="/auth/sign-in">
            <Button variant="ghost" size="md" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-charcoal-light">
          Didn&apos;t receive the email? Check your spam folder or try signing up again.
        </p>
      </Card>
    </Container>
  );
}

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense>
      <CheckEmailContent searchParams={params} />
    </Suspense>
  );
}
