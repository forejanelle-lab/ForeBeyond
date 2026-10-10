import { countCompletedTrustChecks, getTrustFill } from "@/lib/trust-score";

interface SearchTrustBadgeProps {
  listingId: string;
  score: number;
  verified?: boolean;
  breakdown?: Record<string, number> | null;
  className?: string;
}

export function SearchTrustBadge({
  listingId,
  score,
  verified = false,
  breakdown = null,
  className = "",
}: SearchTrustBadgeProps) {
  const fill = getTrustFill(score);
  const { completed, total } = countCompletedTrustChecks(breakdown, score);
  const fillHeight = 22 * fill;
  const caption = verified ? "Verified host" : "Host checks";
  const clipId = `trust-fill-${listingId.replace(/[^a-z0-9-]/gi, "")}`;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
        role="img"
      >
        <title>{`${caption}: ${completed} of ${total} trust checks complete`}</title>
        <defs>
          <clipPath id={clipId}>
            <rect x="3" y={22 - fillHeight} width="18" height={fillHeight} />
          </clipPath>
        </defs>
        <path
          d="M12 2.4 19.4 6v6.2c0 4.7-3.1 8.9-7.4 10.4C7.7 21.1 4.6 16.9 4.6 12.2V6L12 2.4Z"
          className="fill-sage stroke-forest"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M12 2.4 19.4 6v6.2c0 4.7-3.1 8.9-7.4 10.4C7.7 21.1 4.6 16.9 4.6 12.2V6L12 2.4Z"
          className="fill-forest"
          clipPath={`url(#${clipId})`}
        />
        {verified ? (
          <path
            d="M8.4 12.1 10.7 14.4 15.6 9.4"
            className={fill >= 0.45 ? "stroke-white" : "stroke-forest"}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}
      </svg>
      <div className="min-w-0 leading-tight">
        <p className="text-xs font-semibold text-forest">{caption}</p>
        <p className="text-[11px] text-muted">
          {completed} of {total} checks complete
        </p>
      </div>
      <span className="sr-only">
        Host verification progress {Math.round(fill * 100)} percent. {completed} of {total} trust
        checks complete.
      </span>
    </div>
  );
}
