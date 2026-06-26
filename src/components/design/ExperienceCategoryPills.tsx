"use client";

import { Suspense } from "react";
import { FilterPills } from "@/components/design/FilterPills";
import { EXPERIENCE_CATEGORIES } from "@/lib/experiences";

function PillsInner() {
  const pills = [
    { id: "", label: "All Experiences", href: "/experiences" },
    ...EXPERIENCE_CATEGORIES.map((cat) => ({
      id: cat.value,
      label: cat.label,
      href: `/experiences?category=${cat.value}`,
    })),
  ];

  return <FilterPills pills={pills} paramKey="category" />;
}

export function ExperienceCategoryPills() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <PillsInner />
    </Suspense>
  );
}
