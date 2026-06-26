"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface FilterPill {
  id: string;
  label: string;
  href: string;
}

interface FilterPillsProps {
  pills: FilterPill[];
  paramKey?: string;
}

export function FilterPills({ pills, paramKey = "category" }: FilterPillsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramKey) ?? pills[0]?.id ?? "";

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => {
        const isActive = active === pill.id;
        return (
          <Link
            key={pill.id}
            href={pill.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-forest text-white shadow-sm"
                : "bg-white text-charcoal-light border border-sage-dark/40 hover:border-forest/30 hover:text-forest"
            }`}
          >
            {pill.label}
          </Link>
        );
      })}
    </div>
  );
}
