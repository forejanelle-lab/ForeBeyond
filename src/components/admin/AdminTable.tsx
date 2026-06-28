import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatAdminDate } from "@/lib/admin";

interface AdminTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T> {
  rows: T[];
  columns: AdminTableColumn<T>[];
  emptyMessage?: string;
  wide?: boolean;
}

export function AdminTable<T extends { id: string }>({
  rows,
  columns,
  emptyMessage = "No records found.",
  wide = false,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return (
      <Card variant="outline" padding="md">
        <p className="text-sm text-charcoal-light">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card variant="outline" padding="md" className="overflow-hidden p-0">
      <div className={wide ? "overflow-x-auto lg:overflow-visible" : "overflow-x-auto"}>
        <table className={`w-full text-sm ${wide ? "table-fixed" : ""}`}>
          <thead>
            <tr className="border-b border-sage-dark/30 bg-sage/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-semibold text-forest ${
                    wide ? col.headerClassName ?? "" : `whitespace-nowrap ${col.headerClassName ?? ""}`
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-sage-dark/20 last:border-0">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-charcoal-light align-top ${
                      col.className ?? ""
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AdminDateCell({ value }: { value: string | null }) {
  return <span>{formatAdminDate(value)}</span>;
}

export function AdminBadgeCell({
  label,
  variant = "outline",
}: {
  label: string;
  variant?: "outline" | "success" | "warning" | "default" | "gold";
}) {
  return <Badge variant={variant}>{label}</Badge>;
}
