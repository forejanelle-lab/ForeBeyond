import { Shield, Lock, Users } from "lucide-react";

const indicators = [
  { icon: Shield, label: "Verified Families" },
  { icon: Lock, label: "Secure & Private" },
  { icon: Users, label: "Trusted Community" },
];

interface TrustIndicatorsProps {
  variant?: "hero" | "inline";
  className?: string;
}

export function TrustIndicators({ variant = "inline", className = "" }: TrustIndicatorsProps) {
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
