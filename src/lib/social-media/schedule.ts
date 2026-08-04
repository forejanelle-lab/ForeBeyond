const DEFAULT_HOUR = 10;
const DEFAULT_MINUTE = 0;

/** Weekday publish slots (Mon–Fri) at 10:00 AM local browser time, stored as ISO UTC. */
export function distributePublishDates(
  count: number,
  monthInput: string,
  startFrom = new Date()
): string[] {
  const [yearStr, monthStr] = monthInput.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error("Invalid schedule month. Use YYYY-MM.");
  }

  const weekdays: Date[] = [];
  const cursor = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  while (cursor <= monthEnd) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      const slot = new Date(cursor);
      slot.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
      if (slot >= startFrom) {
        weekdays.push(new Date(slot));
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (weekdays.length === 0) {
    throw new Error("No weekday slots remain in the selected month.");
  }

  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.min(
      Math.floor((i * weekdays.length) / count),
      weekdays.length - 1
    );
    dates.push(weekdays[index]!.toISOString());
  }

  return dates;
}

export function formatScheduleMonthLabel(monthInput: string): string {
  const [yearStr, monthStr] = monthInput.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthInput;
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function currentMonthInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}
