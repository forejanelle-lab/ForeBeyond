"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { DisabledWithTooltip } from "@/components/ui/DisabledWithTooltip";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  isTravelerSignupEnabled,
  TRAVELER_SIGNUP_DISABLED_MESSAGE,
} from "@/lib/traveler-signup";

type ButtonLinkProps = ComponentProps<typeof ButtonLink>;

type TravelerSignupButtonProps = Omit<ButtonLinkProps, "href"> & {
  href?: string;
};

const variantStyles = {
  primary:
    "bg-forest text-white hover:bg-forest-light focus-visible:ring-forest/50 shadow-sm",
  secondary: "bg-sage text-forest hover:bg-sage-dark focus-visible:ring-sage/50",
  outline:
    "border-2 border-forest text-forest hover:bg-forest hover:text-white focus-visible:ring-forest/50",
  ghost: "text-forest hover:bg-sage/50 focus-visible:ring-forest/50",
  gold: "bg-gold text-white hover:bg-gold-light focus-visible:ring-gold/50 shadow-sm",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const;

export function TravelerSignupButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  href: _href = "/auth/sign-up",
  ...props
}: TravelerSignupButtonProps) {
  if (isTravelerSignupEnabled()) {
    return (
      <ButtonLink href={_href} variant={variant} size={size} className={className} {...props}>
        {children}
      </ButtonLink>
    );
  }

  return (
    <DisabledWithTooltip message={TRAVELER_SIGNUP_DISABLED_MESSAGE} className={className}>
      <span
        aria-disabled="true"
        title={TRAVELER_SIGNUP_DISABLED_MESSAGE}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 cursor-not-allowed opacity-60 ${variantStyles[variant]} ${sizeStyles[size]}`}
      >
        {children}
      </span>
    </DisabledWithTooltip>
  );
}

type TravelerSignupLinkProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

export function TravelerSignupLink({
  children,
  className = "",
  href = "/auth/sign-up",
}: TravelerSignupLinkProps) {
  if (isTravelerSignupEnabled()) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <DisabledWithTooltip message={TRAVELER_SIGNUP_DISABLED_MESSAGE} className="inline-block">
      <span
        aria-disabled="true"
        title={TRAVELER_SIGNUP_DISABLED_MESSAGE}
        className={`cursor-not-allowed opacity-60 ${className}`}
      >
        {children}
      </span>
    </DisabledWithTooltip>
  );
}
