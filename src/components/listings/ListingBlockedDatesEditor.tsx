"use client";

import { CalendarX, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDateRange } from "@/lib/stay-requests";
import type { EditableBlockedDateRange } from "@/lib/listing-blocked-dates";

interface ListingBlockedDatesEditorProps {
  ranges: EditableBlockedDateRange[];
  onChange: (ranges: EditableBlockedDateRange[]) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ListingBlockedDatesEditor({ ranges, onChange }: ListingBlockedDatesEditorProps) {
  const minDate = todayIso();

  function updateRange(index: number, patch: Partial<EditableBlockedDateRange>) {
    onChange(ranges.map((range, i) => (i === index ? { ...range, ...patch } : range)));
  }

  function addRange() {
    onChange([...ranges, { start_date: "", end_date: "", note: "" }]);
  }

  function removeRange(index: number) {
    onChange(ranges.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-forest">Blocked-out dates</h2>
        <p className="text-sm text-charcoal-light mt-1">
          Mark dates when you cannot host. Travelers cannot request or confirm stays on these dates.
          Requests that overlap other guests&apos; stays are still allowed — review each one and
          confirm you have room.
        </p>
      </div>

      {ranges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-dark bg-sage/20 px-4 py-6 text-center text-sm text-charcoal-light">
          <CalendarX className="h-6 w-6 mx-auto mb-2 text-forest" />
          No blocked-out dates yet. Add ranges for vacations, renovations, or other unavailable periods.
        </div>
      ) : (
        <div className="space-y-3">
          {ranges.map((range, index) => (
            <div
              key={range.id ?? `new-${index}`}
              className="rounded-xl border border-sage-dark/40 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-forest">
                  {range.start_date && range.end_date && range.end_date > range.start_date
                    ? formatDateRange(range.start_date, range.end_date)
                    : `Blocked range ${index + 1}`}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRange(index)}
                  aria-label="Remove blocked date range"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Start date"
                  type="date"
                  min={minDate}
                  value={range.start_date}
                  onChange={(e) => {
                    const start_date = e.target.value;
                    updateRange(index, {
                      start_date,
                      end_date:
                        range.end_date && start_date >= range.end_date ? "" : range.end_date,
                    });
                  }}
                />
                <Input
                  label="End date"
                  type="date"
                  min={range.start_date || minDate}
                  value={range.end_date}
                  onChange={(e) => updateRange(index, { end_date: e.target.value })}
                />
              </div>
              <Input
                label="Note (optional)"
                value={range.note ?? ""}
                onChange={(e) => updateRange(index, { note: e.target.value })}
                placeholder="Family vacation, home repairs..."
              />
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="secondary" size="md" onClick={addRange} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Add blocked-out dates
      </Button>
    </div>
  );
}
