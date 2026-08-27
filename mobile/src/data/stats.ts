import { ScanRow } from './types';

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffDays = (now.getTime() - d.getTime()) / 86400000;
  return diffDays >= 0 && diffDays < 7;
}

export function computeStats(history: ScanRow[]) {
  return {
    today: history.filter(h => isToday(h.scanned_at)).length,
    flagged: history.filter(h => isToday(h.scanned_at) && h.detected).length,
    total: history.length,
    flaggedTotal: history.filter(h => h.detected).length,
    week: history.filter(h => isThisWeek(h.scanned_at)).length,
  };
}
