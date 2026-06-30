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

const legalContentClassName = [
  "space-y-8",
  "[&_section]:space-y-4",
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-forest",
  "[&_p]:text-base [&_p]:text-charcoal-light [&_p]:leading-relaxed",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:text-charcoal-light",
  "[&_a]:text-forest [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-forest-light",
  "[&_strong]:font-semibold [&_strong]:text-forest",
].join(" ");

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <Section background="cream" className="!py-10 md:!py-14">
      <Container size="sm">
        <Card variant="outline" padding="md" className="md:p-10">
          <header className="border-b border-sage-dark/30 pb-6 mb-8">
            <p className="text-xs font-medium uppercase tracking-wide text-gold mb-2">Legal</p>
            <h1 className="text-3xl md:text-4xl font-bold text-forest">{title}</h1>
            <p className="mt-2 text-sm text-charcoal-light">Last updated: {formatUpdatedDate()}</p>
          </header>
          <article className={legalContentClassName}>{children}</article>
        </Card>
      </Container>
    </Section>
  );
}
