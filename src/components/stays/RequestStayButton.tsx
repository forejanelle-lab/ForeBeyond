import Link from "next/link";
import { STAY_REQUEST_VERIFICATION_MESSAGE } from "@/lib/traveler-verification";

interface RequestStayButtonProps {
  listingId: string;
  enabled: boolean;
  disabledReason?: string;
}

const buttonClassName =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium w-full transition-colors";

export function RequestStayButton({
  listingId,
  enabled,
  disabledReason = STAY_REQUEST_VERIFICATION_MESSAGE,
}: RequestStayButtonProps) {
  if (enabled) {
    return (
      <Link
        href={`/families/${listingId}/request`}
        className={`${buttonClassName} bg-forest text-white hover:bg-forest-light`}
      >
        Request to Stay
      </Link>
    );
  }

  return (
    <div className="relative group w-full">
      <span
        aria-disabled="true"
        title={disabledReason}
        className={`${buttonClassName} bg-forest/35 text-white/75 cursor-not-allowed`}
      >
        Request to Stay
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full z-30 mb-2 w-64 -translate-x-1/2 rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-xs text-charcoal-light text-center shadow-lg opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
      >
        {disabledReason}
      </div>
    </div>
  );
}
