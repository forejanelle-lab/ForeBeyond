import { type HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  background?: "cream" | "white" | "sage" | "forest";
}

const backgroundStyles = {
  cream: "bg-cream",
  white: "bg-white",
  sage: "bg-sage/40",
  forest: "bg-forest text-white",
};

export function Section({
  className = "",
  background = "cream",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={`py-16 md:py-24 ${backgroundStyles[background]} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
