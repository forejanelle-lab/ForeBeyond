import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "gold" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-sage text-forest",
  success: "bg-forest/10 text-forest",
  warning: "bg-amber-100 text-amber-800",
  gold: "bg-gold/15 text-gold-dark",
  outline: "border border-sage-dark text-charcoal-light bg-transparent",
};

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
