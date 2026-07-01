import Link from "next/link";

interface LogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

export function LogoMark({
  size = 40,
  light = false,
  idSuffix = "nav",
}: {
  size?: number;
  light?: boolean;
  idSuffix?: string;
}) {
  const forest = light ? "#FFFFFF" : "#214E34";
  const gold = "#C9A227";
  const ring = light ? "rgba(255,255,255,0.5)" : "rgba(33,78,52,0.4)";
  const leaf = light ? "rgba(255,255,255,0.9)" : "#214E34";
  const gradId = `logo-emblem-${idSuffix}${light ? "-light" : ""}`;

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
        <linearGradient id={gradId} x1="8" y1="20" x2="32" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={forest} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" stroke={ring} strokeWidth="1" />
      <circle
        cx="20"
        cy="20"
        r="14.5"
        stroke={ring}
        strokeWidth="0.75"
        strokeDasharray="2.5 3"
        opacity="0.65"
      />
      <line x1="20" y1="2" x2="20" y2="5.5" stroke={ring} strokeWidth="1" strokeLinecap="round" />
      <line x1="20" y1="34.5" x2="20" y2="38" stroke={ring} strokeWidth="1" strokeLinecap="round" />
      <line x1="2" y1="20" x2="5.5" y2="20" stroke={ring} strokeWidth="1" strokeLinecap="round" />
      <line x1="34.5" y1="20" x2="38" y2="20" stroke={ring} strokeWidth="1" strokeLinecap="round" />
      <path
        d="M20 10 C17 13.5 15.5 16.5 15.5 19.5 C15.5 22.5 17 25.5 20 27.5 C23 25.5 24.5 22.5 24.5 19.5 C24.5 16.5 23 13.5 20 10Z"
        fill={leaf}
        opacity="0.92"
      />
      <path d="M20 27.5 L20 31.5" stroke={forest} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="20" cy="20" r="2.75" fill={gold} />
      <path
        d="M20 17.5 L20 22.5 M17.5 20 L22.5 20"
        stroke={light ? forest : "#F9F7F2"}
        strokeWidth="0.85"
        strokeLinecap="round"
      />
      <path
        d="M20 8.5 A11.5 11.5 0 0 1 28 14"
        stroke={`url(#${gradId})`}
        strokeWidth="0.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
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
  const textClass = isLight ? "text-white" : "text-forest";
  const markSize = size === "sm" ? 36 : 46;
  const textSize =
    size === "sm" ? "text-[0.75rem] tracking-[0.16em]" : "text-[0.85rem] md:text-base tracking-[0.18em]";

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="transition-transform duration-300 group-hover:scale-[1.04]">
        <LogoMark size={markSize} light={isLight} idSuffix={size} />
      </div>
      {showText && (
        <span className={`font-semibold uppercase ${textSize} ${textClass}`}>Fore Beyond</span>
      )}
    </Link>
  );
}
