import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <Container className="py-24 md:py-32 text-center">
      <p className="text-sm font-medium text-gold uppercase tracking-wide mb-3">404</p>
      <h1 className="text-3xl md:text-4xl font-bold text-forest mb-3">Page not found</h1>
      <p className="text-charcoal-light max-w-md mx-auto mb-8">
        This page doesn&apos;t exist or may have moved. Head back home or search for a host family.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/" variant="primary" size="md">
          Back to home
        </ButtonLink>
        <ButtonLink href="/search" variant="secondary" size="md">
          Search families
        </ButtonLink>
      </div>
    </Container>
  );
}
