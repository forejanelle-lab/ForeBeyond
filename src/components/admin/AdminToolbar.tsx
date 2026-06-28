"use client";

interface AdminToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  children,
}: AdminToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-6">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="flex-1 min-w-[200px] rounded-xl border border-sage-dark/30 bg-white px-4 py-2.5 text-sm text-forest placeholder:text-charcoal-light focus:outline-none focus:ring-2 focus:ring-forest/20"
      />
      {children}
    </div>
  );
}

export function AdminSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-charcoal-light">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-sage-dark/30 bg-white px-3 py-2.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
