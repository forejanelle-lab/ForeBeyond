import { Card } from "@/components/ui/Card";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
}

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <Card variant="outline" padding="md">
      <p className="text-sm text-charcoal-light">{label}</p>
      <p className="text-2xl font-bold text-forest mt-1">{value}</p>
      {hint && <p className="text-xs text-charcoal-light mt-1">{hint}</p>}
    </Card>
  );
}
