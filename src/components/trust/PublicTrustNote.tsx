import { getPublicTrustSummary } from "@/lib/trust-score";

interface PublicTrustNoteProps {
  score: number;
  explain?: boolean;
  className?: string;
}

export function PublicTrustNote({
  score,
  explain = false,
  className = "",
}: PublicTrustNoteProps) {
  if (!(score > 0)) return null;

  return (
    <p className={`text-xs text-muted leading-relaxed ${className}`}>
      {getPublicTrustSummary(score)}
      {explain ? " · from verification and activity, not a stay rating" : ""}
    </p>
  );
}
