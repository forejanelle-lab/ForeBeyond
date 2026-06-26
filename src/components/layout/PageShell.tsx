import { Container } from "@/components/ui/Container";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <Container className="py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-forest">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-charcoal-light">{subtitle}</p>}
      </header>
      {children}
    </Container>
  );
}
