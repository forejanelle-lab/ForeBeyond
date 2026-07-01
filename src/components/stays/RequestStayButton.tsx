import Link from "next/link";
import { STAY_REQUEST_VERIFICATION_MESSAGE } from "@/lib/traveler-verification";

interface RequestStayButtonProps {
  listingId: string;
  enabled: boolean;
}

const buttonClassName =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium w-full transition-colors";

export function RequestStayButton({ listingId, enabled }: RequestStayButtonProps) {
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
    <span
      title={STAY_REQUEST_VERIFICATION_MESSAGE}
      aria-disabled="true"
      className={`${buttonClassName} bg-forest/35 text-white/75 cursor-not-allowed`}
    >
      Request to Stay
    </span>
  );
}
