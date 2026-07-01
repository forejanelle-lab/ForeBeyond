import type { ReactNode } from "react";

interface DisabledWithTooltipProps {
  message: string;
  children: ReactNode;
  className?: string;
  tooltipClassName?: string;
}

export function DisabledWithTooltip({
  message,
  children,
  className = "",
  tooltipClassName = "w-64",
}: DisabledWithTooltipProps) {
  return (
    <div className={`relative group ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 bottom-full z-30 mb-2 -translate-x-1/2 rounded-xl border border-sage-dark/30 bg-white px-3 py-2 text-xs text-charcoal-light text-center shadow-lg opacity-0 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 ${tooltipClassName}`}
      >
        {message}
      </div>
    </div>
  );
}
