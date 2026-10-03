const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses a `YYYY-MM` string into a zero-based month index since year 0. */
function toMonthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
}

function currentMonthIndex(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

/** Inclusive number of months between two `YYYY-MM` dates (end defaults to now). */
export function monthsBetween(start: string, end?: string): number {
  const endIndex = end ? toMonthIndex(end) : currentMonthIndex();
  return Math.max(1, endIndex - toMonthIndex(start) + 1);
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years) {
    parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  }
  if (rest) {
    parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  }
  return parts.join(' ');
}

export function yearsSince(start: string): number {
  return Math.floor(monthsBetween(start) / 12);
}
