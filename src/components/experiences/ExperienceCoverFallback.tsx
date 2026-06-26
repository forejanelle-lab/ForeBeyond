import { LogoMark } from "@/components/design/Logo";

interface ExperienceCoverFallbackProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LOGO_SIZES = {
  sm: 44,
  md: 56,
  lg: 80,
} as const;

export function ExperienceCoverFallback({
  size = "md",
  className = "",
}: ExperienceCoverFallbackProps) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center bg-sage ${className}`}
      aria-hidden
    >
      <LogoMark size={LOGO_SIZES[size]} />
    </div>
  );
}
