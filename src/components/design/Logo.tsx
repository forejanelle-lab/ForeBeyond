import Link from "next/link";

interface LogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  const forest = light ? "#FFFFFF" : "#214E34";
  const gold = "#D4AF37";
  const ring = light ? "rgba(255,255,255,0.55)" : "#214E34";
  const gradId = light ? "logo-star-light" : "logo-star";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="6" y1="20" x2="34" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0.5" stopColor={forest} />
          <stop offset="0.5" stopColor={gold} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17.5" stroke={ring} strokeWidth="1" />
      <line x1="20" y1="1.5" x2="20" y2="5" stroke={ring} strokeWidth="1" />
      <line x1="20" y1="35" x2="20" y2="38.5" stroke={ring} strokeWidth="1" />
      <line x1="1.5" y1="20" x2="5" y2="20" stroke={ring} strokeWidth="1" />
      <line x1="35" y1="20" x2="38.5" y2="20" stroke={ring} strokeWidth="1" />
      <path
        d="M20 8 L23.8 18.2 L34 20 L23.8 21.8 L20 32 L16.2 21.8 L6 20 L16.2 18.2 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const isLight = variant === "light";
  const textClass = isLight ? "text-white" : "text-charcoal";
  const markSize = size === "sm" ? 32 : 38;
  const textSize = size === "sm" ? "text-sm tracking-[0.1em]" : "text-base md:text-lg tracking-[0.12em]";

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="transition-transform group-hover:scale-[1.02]">
        <LogoMark size={markSize} light={isLight} />
      </div>
      {showText && (
        <span className={`font-bold uppercase ${textSize} ${textClass}`}>
          Fore Beyond
        </span>
      )}
    </Link>
  );
}
