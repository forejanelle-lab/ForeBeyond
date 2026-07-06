import { ArrowRight } from "lucide-react";
import { PartnershipContactButton } from "@/components/seo/PartnershipContactButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getJapanHostCtaHref, type JapanHostSeoPage } from "@/lib/seo/japan-host-catalog";

interface JapanHostSeoCtaProps {
  page: JapanHostSeoPage;
  size?: "md" | "lg";
  className?: string;
}

export function JapanHostSeoCta({ page, size = "lg", className = "" }: JapanHostSeoCtaProps) {
  if (page.ctaKind === "partnership") {
    return (
      <PartnershipContactButton
        label={page.ctaLabel}
        size={size}
        variant="white"
        className={className}
      />
    );
  }

  return (
    <ButtonLink href={getJapanHostCtaHref(page)} variant="white" size={size} className={className}>
      {page.ctaLabel}
      <ArrowRight className="h-4 w-4" />
    </ButtonLink>
  );
}
