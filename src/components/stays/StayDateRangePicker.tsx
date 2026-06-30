"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateRange } from "@/lib/stay-requests";
import {
  addMonths,
  daysInMonth,
  isBlockedNight,
  isStayCheckInDisabled,
  isStayCheckOutDisabled,
  parseIsoDate,
  toIsoDate,
  type BlockedDateRange,
} from "@/lib/stay-availability";

interface StayDateRangePickerProps {
  minDate: string;
  startDate: string;
  endDate: string;
  blockedRanges: BlockedDateRange[];
  onChange: (startDate: string, endDate: string) => void;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function initialViewMonth(minDate: string, startDate: string) {
  const anchor = startDate || minDate;
  const { year, month } = parseIsoDate(anchor);
  return { year, month };
}

export function StayDateRangePicker({
  minDate,
  startDate,
  endDate,
  blockedRanges,
  onChange,
}: StayDateRangePickerProps) {
  const [{ year, month }, setViewMonth] = useState(() => initialViewMonth(minDate, startDate));
  const selectingCheckOut = Boolean(startDate && !endDate);

  const minMonth = useMemo(() => parseIsoDate(minDate), [minDate]);
  const canGoPrev =
    year > minMonth.year || (year === minMonth.year && month > minMonth.month);

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const totalDays = daysInMonth(year, month);
    const cells: Array<{ iso: string | null; day: number | null }> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ iso: null, day: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({ iso: toIsoDate(year, month, day), day });
    }

    return cells;
  }, [year, month]);

  function isDayDisabled(iso: string): boolean {
    if (selectingCheckOut) {
      return isStayCheckOutDisabled(iso, startDate, blockedRanges);
    }
    return isStayCheckInDisabled(iso, minDate, blockedRanges);
  }

  function handleDayClick(iso: string) {
    if (isDayDisabled(iso)) return;

    if (!startDate || (startDate && endDate)) {
      onChange(iso, "");
      return;
    }

    if (iso <= startDate) {
      onChange(iso, "");
      return;
    }

    onChange(startDate, iso);
  }

  function goToPrevMonth() {
    if (!canGoPrev) return;
    setViewMonth((current) => addMonths(current.year, current.month, -1));
  }

  function goToNextMonth() {
    setViewMonth((current) => addMonths(current.year, current.month, 1));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-sage-dark bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="rounded-lg p-1.5 text-forest hover:bg-sage/50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-medium text-forest">
            {MONTH_LABELS[month - 1]} {year}
          </p>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg p-1.5 text-forest hover:bg-sage/50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="text-center text-[11px] font-medium text-charcoal-light py-1">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Stay dates">
          {calendarDays.map((cell, index) => {
            if (!cell.iso || cell.day === null) {
              return <div key={`empty-${index}`} aria-hidden="true" />;
            }

            const blocked = isBlockedNight(cell.iso, blockedRanges);
            const disabled = isDayDisabled(cell.iso);
            const isStart = cell.iso === startDate;
            const isEnd = cell.iso === endDate;
            const inRange =
              Boolean(startDate && endDate && cell.iso > startDate && cell.iso < endDate);

            let dayClass =
              "h-9 w-full rounded-lg text-sm transition-colors ";
            if (disabled) {
              dayClass += blocked
                ? "bg-sage/30 text-charcoal-light/50 line-through cursor-not-allowed"
                : "text-charcoal-light/40 cursor-not-allowed";
            } else if (isStart || isEnd) {
              dayClass += "bg-forest text-white font-medium";
            } else if (inRange) {
              dayClass += "bg-forest/15 text-forest";
            } else {
              dayClass += "text-charcoal hover:bg-sage/50";
            }

            return (
              <button
                key={cell.iso}
                type="button"
                role="gridcell"
                disabled={disabled}
                onClick={() => handleDayClick(cell.iso!)}
                aria-label={cell.iso}
                aria-selected={isStart || isEnd || inRange}
                className={dayClass}
              >
                {cell.day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-charcoal-light">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-forest" aria-hidden="true" />
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-sage/30 line-through" aria-hidden="true" />
            Unavailable
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-sage/30 px-3 py-2">
          <p className="text-charcoal-light text-xs">Check-in</p>
          <p className="font-medium text-forest">{startDate || "Select a date"}</p>
        </div>
        <div className="rounded-xl bg-sage/30 px-3 py-2">
          <p className="text-charcoal-light text-xs">Check-out</p>
          <p className="font-medium text-forest">{endDate || "Select a date"}</p>
        </div>
      </div>

      {startDate && endDate && (
        <p className="text-xs text-charcoal-light">
          {formatDateRange(startDate, endDate)}
        </p>
      )}

      <p className="text-xs text-charcoal-light">
        {selectingCheckOut
          ? "Select your check-out date. Unavailable dates cannot be selected."
          : "Select your check-in date, then your check-out date."}
      </p>
    </div>
  );
}
