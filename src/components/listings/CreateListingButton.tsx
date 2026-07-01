import Link from "next/link";
import type { ReactNode } from "react";
import { HOST_LISTING_VERIFICATION_MESSAGE } from "@/lib/traveler-verification";

type CreateListingButtonSize = "md" | "lg";

interface CreateListingButtonProps {
  enabled: boolean;
  disabledReason?: string;
  size?: CreateListingButtonSize;
  className?: string;
  children: ReactNode;
}

const sizeStyles: Record<CreateListingButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

const buttonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors";

export function CreateListingButton({
  enabled,
  disabledReason = HOST_LISTING_VERIFICATION_MESSAGE,
  size = "md",
  className = "",
  children,
}: CreateListingButtonProps) {
  const sizeClass = sizeStyles[size];

  if (enabled) {
    return (
      <Link
        href="/host/listings/new"
        className={`${buttonClassName} ${sizeClass} bg-forest text-white hover:bg-forest-light ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <span
        aria-disabled="true"
        title={disabledReason}
        className={`${buttonClassName} ${sizeClass} bg-forest/35 text-white/75 cursor-not-allowed`}
      >
        {children}
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
