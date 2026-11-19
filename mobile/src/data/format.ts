export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Today's date on this phone as "YYYY-MM-DD", in local time. toISOString() gives the UTC date,
 * which in Zimbabwe (UTC+2) is still yesterday between midnight and 2 AM.
 */
export function localDateString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatScannedAt(isoDate: string): string {
  return formatDate(new Date(isoDate + 'T00:00:00'));
}

/** "12 Nov" style short date for a timestamp, with the year only when it isn't this year. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function greetingFor(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
