const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toMonthIndex(value: string): number {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + (month - 1);
}

function currentMonthIndex(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

/** `2021-02` → `Feb 2021` */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return `${MONTHS[month - 1]} ${year}`;
}

/** Inclusive number of months between two `YYYY-MM` dates (end defaults to now). */
export function monthsBetween(start: string, end?: string): number {
  return Math.max(1, (end ? toMonthIndex(end) : currentMonthIndex()) - toMonthIndex(start) + 1);
}

/** `69` → `5 yrs 9 mos` */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years && `${years} yr${years > 1 ? 's' : ''}`, rest && `${rest} mo${rest > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' ');
}

/** Whole years elapsed since a `YYYY-MM` date. */
export function yearsSince(start: string): number {
  return Math.floor(monthsBetween(start) / 12);
}
