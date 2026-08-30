import { Check } from "lucide-react";

const defaultBadges = [
  "Verified Identity",
  "Address Verified",
  "Community Reviewed",
];

interface VerificationBadgeRowProps {
  verified?: boolean;
}

export function VerificationBadgeRow({ verified = true }: VerificationBadgeRowProps) {
  if (!verified) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {defaultBadges.map((label) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-light"
        >
          <Check className="h-4 w-4 text-forest shrink-0" strokeWidth={2.5} />
          {label}
        </span>
      ))}
    </div>
  );
}
