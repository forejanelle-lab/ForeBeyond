import Link from "next/link";
import { Shield, Sparkles } from "lucide-react";
import { brand } from "@/lib/brand";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-cream via-sage/20 to-cream">
      <Container className="py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="hidden lg:block">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white font-bold text-sm transition-transform group-hover:scale-105">
                FB
              </div>
              <span className="text-xl font-semibold text-forest">{brand.name}</span>
            </Link>

            <Badge variant="gold" className="mb-4">
              <Sparkles className="h-3 w-3" />
              Trust-first travel
            </Badge>

            <h1 className="text-4xl font-bold text-forest leading-tight mb-4">
              {title}
            </h1>
            <p className="text-lg text-charcoal-light leading-relaxed mb-8">
              {subtitle}
            </p>

            <ul className="space-y-4">
              {[
                "Verified host families worldwide",
                "Authentic cultural immersion, not tourism",
                "Built on trust scores and community reviews",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-charcoal-light">
                  <Shield className="h-5 w-5 text-forest shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-white font-bold text-sm">
                  FB
                </div>
                <span className="text-lg font-semibold text-forest">{brand.name}</span>
              </Link>
              <h1 className="text-3xl font-bold text-forest">{title}</h1>
              <p className="mt-2 text-charcoal-light">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </Container>
    </div>
  );
}
