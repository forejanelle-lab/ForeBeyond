"use client";

import Link from "next/link";
import { Logo } from "@/components/design/Logo";
import { ContactFooterLink } from "@/components/support/ContactFooterLink";
import { Container } from "@/components/ui/Container";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { brand } from "@/lib/brand";
import { isMailtoNavHref } from "@/lib/nav-links";

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const className = "text-sm text-white/70 hover:text-white transition-colors";

  if (href.startsWith("mailto:") && isMailtoNavHref(href)) {
    return <ContactFooterLink label={label} className={className} />;
  }

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  const t = useTranslations();

  const productLinks = [
    { label: t("nav.howItWorks"), href: "/#how-it-works" },
    { label: t("footer.searchFamilies"), href: "/search" },
    { label: t("footer.destinations"), href: "/destinations" },
    { label: t("footer.travelGuides"), href: "/guides" },
    { label: t("nav.trustCenter"), href: "/trust-center" },
  ];

  const companyLinks = [
    { label: t("nav.about"), href: "/#mission" },
    { label: "Become a host in Japan", href: "/become-a-host-japan" },
    { label: "Language school partnerships", href: "/partner-language-schools-japan" },
    { label: t("footer.verificationCenter"), href: "/verification-center" },
    { label: t("nav.contact"), href: "mailto:hello@forebeyond.com" },
  ];

  const legalLinks = [
    { label: t("footer.privacyPolicy"), href: "/privacy" },
    { label: t("footer.termsOfService"), href: "/terms" },
    { label: t("footer.cancellationPolicy"), href: "/cancellation-policy" },
    { label: t("footer.communityGuidelines"), href: "/guidelines" },
  ];

  return (
    <footer className="border-t border-sage-dark/30 bg-forest text-white">
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo variant="light" className="mb-4" />
            <p className="text-sm text-white/70 leading-relaxed">{t("brand.tagline")}</p>
            <p className="mt-2 text-xs text-white/50 italic">{t("brand.secondaryTagline")}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.product")}</h4>
            <ul className="space-y-2.5">
              {productLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t("footer.legal")}</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} {brand.name}. {t("footer.rightsReserved")}
          </p>
          <p className="text-xs text-white/40 text-center sm:text-right max-w-md">
            {t("footer.disclaimer")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
