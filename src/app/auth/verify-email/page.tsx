import { Suspense } from "react";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { VerifyEmailContent } from "./VerifyEmailContent";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="py-16 md:py-24">
          <AuthBrandHeader />
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="flex justify-center mb-4">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
            <p className="text-charcoal-light">Checking verification status...</p>
          </Card>
        </Container>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
