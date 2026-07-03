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

export function LogoMark({
  size = 40,
}: {
  size?: number;
  light?: boolean;
  idSuffix?: string;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      className="object-cover object-left mix-blend-screen"
      style={{ width: size, height: size }}
      unoptimized
      aria-hidden
    />
  );
}

export function Logo({
  variant: _variant = "default",
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
          className={
            showText
              ? "object-contain object-left mix-blend-screen"
              : "object-cover object-left mix-blend-screen"
          }
          style={{ width, height }}
          priority
          unoptimized
        />
      </div>
    </Link>
  );
}
