"use client";

import { ArrowRight } from "lucide-react";
import { PartnershipContactButton } from "@/components/seo/PartnershipContactButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { JapanHostCtaKind } from "@/lib/seo/japan-host-catalog";

interface JapanHostSeoCtaProps {
  ctaKind: JapanHostCtaKind;
  ctaLabel: string;
  href: string;
  size?: "md" | "lg";
  className?: string;
}

export function JapanHostSeoCta({
  ctaKind,
  ctaLabel,
  href,
  size = "lg",
  className = "",
}: JapanHostSeoCtaProps) {
  if (ctaKind === "partnership") {
    return (
      <PartnershipContactButton
        label={ctaLabel}
        size={size}
        variant="white"
        className={className}
      />
    );
  }

  return (
    <ButtonLink href={href} variant="white" size={size} className={className}>
      {ctaLabel}
      <ArrowRight className="h-4 w-4" />
    </ButtonLink>
  );
}
