import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

interface LegalPageShellProps {
  title: string;
  children: ReactNode;
}

function formatUpdatedDate() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <Section background="white" className="!py-10 md:!py-14">
      <Container size="md" className="max-w-3xl">
        <header className="border-b border-sage-dark/30 pb-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-forest">{title}</h1>
          <p className="mt-2 text-sm text-charcoal-light">Last updated: {formatUpdatedDate()}</p>
        </header>
        <article className="legal-content space-y-8">{children}</article>
      </Container>
    </Section>
  );
}
