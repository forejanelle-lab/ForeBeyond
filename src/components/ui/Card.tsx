import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline";
  padding?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-white shadow-sm",
  elevated: "bg-white shadow-lg",
  outline: "bg-white shadow-sm ring-1 ring-sage-dark/25",
};

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  className = "",
  variant = "default",
  padding = "md",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
