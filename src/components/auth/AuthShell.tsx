"use client";

import { Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/design/Logo";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface AuthShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  logoScale?: number;
  logoSize?: "sm" | "md" | "lg" | "xl";
  showLogo?: boolean;
}

const DESKTOP_LOGO_SLOT_HEIGHT = 72;
const MOBILE_LOGO_SLOT_HEIGHT = 56;

function AuthLogoSlot({
  size = "md",
  scale = 1,
  slotHeight,
  className,
  centered = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  scale?: number;
  slotHeight?: number;
  className?: string;
  centered?: boolean;
}) {
  const reservedHeight = slotHeight ?? (size === "sm" ? 56 : size === "lg" ? 96 : size === "xl" ? 120 : 72);

  if (scale <= 1) {
    return (
      <div className={className}>
        <Logo size={size} className={centered ? "justify-center" : undefined} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-visible ${className}`} style={{ height: reservedHeight }}>
      <div
        className={`absolute bottom-0 ${centered ? "left-1/2" : "left-0"}`}
        style={{
          transform: centered ? `translateX(-50%) scale(${scale})` : `scale(${scale})`,
          transformOrigin: centered ? "bottom center" : "bottom left",
        }}
      >
        <Logo size={size} className={centered ? "justify-center" : undefined} />
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  logoScale = 1,
  logoSize = "md",
  showLogo = true,
}: AuthShellProps) {
  const t = useTranslations();
  const resolvedTitle = title ?? t("auth.welcomeBack");
  const resolvedSubtitle = subtitle ?? t("auth.signInSubtitle");
  const bullets = [
    t("auth.bulletVerified"),
    t("auth.bulletImmersion"),
    t("auth.bulletTrust"),
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-cream via-sage/20 to-cream">
      <Container className="py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="hidden lg:block">
            {showLogo && (
              <AuthLogoSlot
                size={logoSize}
                scale={logoScale}
                slotHeight={DESKTOP_LOGO_SLOT_HEIGHT}
                className="mb-8"
              />
            )}

            <Badge variant="gold" className="mb-4">
              <Sparkles className="h-3 w-3" />
              {t("auth.trustBadge")}
            </Badge>

            <h1 className="text-4xl font-bold text-forest leading-tight mb-4">
              {resolvedTitle}
            </h1>
            <p className="text-lg text-charcoal-light leading-relaxed mb-8">
              {resolvedSubtitle}
            </p>

            <ul className="space-y-4">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-3 text-charcoal-light">
                  <Shield className="h-5 w-5 text-forest shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="lg:hidden text-center mb-8">
              {showLogo && (
                <AuthLogoSlot
                  size={logoScale > 1 ? "xl" : "sm"}
                  scale={logoScale}
                  slotHeight={MOBILE_LOGO_SLOT_HEIGHT}
                  className="mb-4 mx-auto"
                  centered
                />
              )}
              <h1 className="text-3xl font-bold text-forest">{resolvedTitle}</h1>
              <p className="mt-2 text-charcoal-light">{resolvedSubtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </Container>
    </div>
  );
}
