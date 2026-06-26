import { Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/design/Logo";
import { AuthBrandHeader } from "@/components/auth/AuthBrandHeader";

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
            <Logo className="mb-8" />

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
              <AuthBrandHeader className="mb-4" />
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
