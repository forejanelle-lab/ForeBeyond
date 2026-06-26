import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface DestinationCardProps {
  name: string;
  subtitle: string;
  image: string;
  href: string;
  variant?: "scroll" | "featured";
}

export function DestinationCard({
  name,
  subtitle,
  image,
  href,
  variant = "scroll",
}: DestinationCardProps) {
  if (variant === "featured") {
    return (
      <Link href={href} className="group block h-full">
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md card-premium">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <p className="text-xl font-semibold text-white">{name}</p>
            <p className="text-sm text-white/85 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block shrink-0 w-[200px] md:w-[220px]">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="220px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-lg font-semibold text-white">{name}</p>
          <p className="text-sm text-white/80">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
