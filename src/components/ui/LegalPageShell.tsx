import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

interface LegalPageShellProps {
  title: string;
  children: ReactNode;
}

function formatUpdatedDate() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Shared classes for legal copy — use on elements when you need explicit utilities. */
export const legalSectionClass = "space-y-4";
export const legalHeadingClass = "text-xl font-semibold text-forest";
export const legalParagraphClass = "text-base text-charcoal-light leading-relaxed";
export const legalListClass = "list-disc pl-6 space-y-2 text-charcoal-light";

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <Section background="cream" className="!py-10 md:!py-14">
      <Container size="sm">
        <Card variant="outline" padding="md" className="md:p-10">
          <header className="border-b border-sage-dark/30 pb-6 mb-8">
            <p className="text-xs font-medium uppercase tracking-wide text-gold mb-2">Legal</p>
            <h1 className="text-3xl md:text-4xl font-bold text-forest">{title}</h1>
            <p className="mt-2 text-sm text-charcoal-light" suppressHydrationWarning>
              Last updated: {formatUpdatedDate()}
            </p>
          </header>
          <article className="legal-content">{children}</article>
        </Card>
      </Container>
    </Section>
  );
}
