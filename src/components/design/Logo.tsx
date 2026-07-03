import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo-fore-beyond.png";
const LOGO_ASPECT = 612 / 408;

interface LogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md";
  showText?: boolean;
  className?: string;
}

function logoImageClass(variant: "default" | "light", showText: boolean) {
  const fit = showText ? "object-contain" : "object-cover";
  const blend =
    variant === "light"
      ? "mix-blend-screen"
      : "invert mix-blend-multiply";

  return `${fit} object-left ${blend}`;
}

export function LogoMark({
  size = 40,
  light = false,
}: {
  size?: number;
  light?: boolean;
  idSuffix?: string;
}) {
  const variant = light ? "light" : "default";

  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      className={logoImageClass(variant, false)}
      style={{ width: size, height: size }}
      unoptimized
      aria-hidden
    />
  );
}

export function Logo({
  variant = "default",
  size = "md",
  showText = true,
  className = "",
}: LogoProps) {
  const height = size === "sm" ? 34 : 42;
  const width = showText ? Math.round(height * LOGO_ASPECT) : height;

  return (
    <Link href="/" className={`inline-flex items-center group ${className}`}>
      <div className="transition-transform duration-300 group-hover:scale-[1.02]">
        <Image
          src={LOGO_SRC}
          alt="Fore Beyond"
          width={width}
          height={height}
          className={logoImageClass(variant, showText)}
          style={{ width, height }}
          priority
          unoptimized
        />
      </div>
    </Link>
  );
}
