import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  /** Hover accent for overview stat groups */
  accent?: "platform" | "moderation";
}

const HOVER_CLASSES: Record<NonNullable<AdminStatCardProps["accent"]>, string> = {
  platform:
    "hover:border-forest/35 hover:bg-sage/50 hover:shadow-md hover:-translate-y-0.5",
  moderation:
    "hover:border-gold/50 hover:bg-gold/10 hover:shadow-md hover:-translate-y-0.5",
};

export function AdminStatCard({ label, value, hint, href, accent = "platform" }: AdminStatCardProps) {
  const card = (
    <Card
      variant="outline"
      padding="md"
      className={
        href
          ? `transition-all cursor-pointer ${HOVER_CLASSES[accent]}`
          : undefined
      }
    >
      <p className="text-sm text-charcoal-light">{label}</p>
      <p className="text-2xl font-bold text-forest mt-1">{value}</p>
      {hint && <p className="text-xs text-charcoal-light mt-1">{hint}</p>}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
