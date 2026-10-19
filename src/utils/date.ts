export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Noon avoids DST edge cases around midnight.
export function fromDateKey(key: string): Date {
  return new Date(`${key.slice(0, 10)}T12:00:00`);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Keys are YYYY-MM-DD, so string comparison is chronological.
export function clampDateKey(key: string, min: string, max: string): string {
  if (key < min) return min;
  if (key > max) return max;
  return key;
}