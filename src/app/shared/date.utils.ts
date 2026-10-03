/** Formats a `YYYY-MM` string as its year, e.g. `2021`. */
export function formatYear(value: string): string {
  return value.split('-')[0];
}

/** Whole years elapsed since a `YYYY-MM` date. */
export function yearsSince(start: string): number {
  const [year, month] = start.split('-').map(Number);
  const now = new Date();
  return Math.floor((now.getFullYear() * 12 + now.getMonth() - (year * 12 + month - 1)) / 12);
}
