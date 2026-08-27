export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatScannedAt(isoDate: string): string {
  return formatDate(new Date(isoDate + 'T00:00:00'));
}
