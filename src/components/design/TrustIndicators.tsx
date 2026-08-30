"use client";

import { Shield, Globe, Lock } from "lucide-react";
import { useTranslations } from "@/components/i18n/LocaleProvider";

interface TrustIndicatorsProps {
  variant?: "hero" | "inline" | "values";
  className?: string;
}

export function TrustIndicators({ variant = "inline", className = "" }: TrustIndicatorsProps) {
  const t = useTranslations();

  if (variant === "values") {
    const values = [
      { icon: Shield, title: t("home.valueVerifiedTitle"), desc: t("home.valueVerifiedDesc") },
      { icon: Globe, title: t("home.valueImmersionTitle"), desc: t("home.valueImmersionDesc") },
      { icon: Lock, title: t("home.valueSupportedTitle"), desc: t("home.valueSupportedDesc") },
    ];

    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 ${className}`}>
        {values.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center md:text-left">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage/80 text-forest mb-4">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-semibold text-forest mb-2">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    );
  }

  const indicators = [
    { icon: Shield, label: t("home.trustVerifiedFamilies") },
    { icon: Lock, label: t("home.trustSecurePrivate") },
    { icon: Globe, label: t("home.trustCommunity") },
  ];

  if (variant === "hero") {
    return (
      <div className={`flex flex-wrap items-center gap-6 md:gap-10 ${className}`}>
        {indicators.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-white/90">
            <Icon className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 ${className}`}>
      {indicators.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-forest" />
          <span className="text-sm font-medium text-charcoal-light">{label}</span>
        </div>
      ))}
    </div>
  );
}
