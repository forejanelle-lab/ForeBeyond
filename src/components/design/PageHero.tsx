import Image from "next/image";
import { Container } from "@/components/ui/Container";

interface PageHeroProps {
  image: string;
  imageAlt: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  height?: "md" | "lg" | "xl";
  align?: "left" | "center";
}

const heights = {
  md: "h-[320px] md:h-[400px]",
  lg: "h-[400px] md:h-[520px]",
  xl: "h-[480px] md:h-[640px]",
};

export function PageHero({
  image,
  imageAlt,
  title,
  subtitle,
  eyebrow,
  children,
  height = "lg",
  align = "left",
}: PageHeroProps) {
  return (
    <section className={`relative overflow-hidden ${heights[height]}`}>
      <Image src={image} alt={imageAlt} fill className="object-cover" priority sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
      <Container className="relative h-full flex flex-col justify-end pb-10 md:pb-14">
        <div
          className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}
        >
          {eyebrow && (
            <p className="text-sm font-medium text-gold mb-3 tracking-wide uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
