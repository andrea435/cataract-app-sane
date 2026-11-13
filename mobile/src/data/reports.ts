import { ReferralRow, ScanRow } from './types';

// Simple programme reports: screenings, referrals and treatment, by clinic and by worker.

export type Period = '7' | '30' | '90' | 'all';

export const PERIODS: { value: Period; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export interface ReferralCounts {
  referred: number;
  attended: number;
  treated: number;
}

export interface Report {
  screenings: number;
  flagged: number;
  patients: number;
  referrals: ReferralCounts;
  byClinic: ({ id: string; name: string } & ReferralCounts)[];
  byWorker: { name: string; screenings: number; flagged: number; referrals: number; treated: number }[];
}

/** Share of `part` in `whole`, as a whole percentage (0 when there's nothing to divide). */
export function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function since(period: Period, now: number): number {
  return period === 'all' ? -Infinity : now - Number(period) * 86400000;
}

/** "Referred" counts every referral; attended includes treated (they attended first). */
function count(rows: ReferralRow[]): ReferralCounts {
  return {
    referred: rows.length,
    attended: rows.filter(r => r.status === 'attended' || r.status === 'treated').length,
    treated: rows.filter(r => r.status === 'treated').length,
  };
}

export function buildReport(
  history: ScanRow[],
  referrals: ReferralRow[],
  clinics: { id: string; name: string }[],
  period: Period,
  now = Date.now()
): Report {
  const from = since(period, now);
  const scans = history.filter(s => Date.parse(`${s.scanned_at}T00:00:00`) >= from);
  const refs = referrals.filter(r => Date.parse(r.created_at) >= from);

  const byClinic = clinics
    .map(c => ({ id: c.id, name: c.name, ...count(refs.filter(r => r.clinic_id === c.id)) }))
    .filter(c => c.referred > 0)
    .sort((a, b) => b.referred - a.referred || a.name.localeCompare(b.name));

  const workers = new Map<string, { name: string; screenings: number; flagged: number; referrals: number; treated: number }>();
  const worker = (name: string) => {
    if (!workers.has(name)) workers.set(name, { name, screenings: 0, flagged: 0, referrals: 0, treated: 0 });
    return workers.get(name)!;
  };
  for (const s of scans) {
    const w = worker(s.worker_name || 'Unknown');
    w.screenings++;
    if (s.detected) w.flagged++;
  }
  for (const r of refs) {
    const w = worker(r.worker_name || 'Unknown');
    w.referrals++;
    if (r.status === 'treated') w.treated++;
  }

  return {
    screenings: scans.length,
    flagged: scans.filter(s => s.detected).length,
    patients: new Set(scans.map(s => s.patient_record_id ?? s.id)).size,
    referrals: count(refs),
    byClinic,
    byWorker: [...workers.values()].sort((a, b) => b.screenings - a.screenings || a.name.localeCompare(b.name)),
  };
}

/** Plain-text version for sharing (WhatsApp, email, SMS). */
export function reportText(r: Report, periodLabel: string): string {
  const lines = [
    `Cataract screening report (${periodLabel.toLowerCase()})`,
    '',
    `Screenings: ${r.screenings} (${r.patients} patients)`,
    `Flagged for cataract: ${r.flagged} (${pct(r.flagged, r.screenings)}%)`,
    `Referred: ${r.referrals.referred}`,
    `Attended: ${r.referrals.attended} (${pct(r.referrals.attended, r.referrals.referred)}%)`,
    `Treated: ${r.referrals.treated} (${pct(r.referrals.treated, r.referrals.referred)}% of referred)`,
  ];
  if (r.byClinic.length) {
    lines.push('', 'By clinic:');
    for (const c of r.byClinic) lines.push(`- ${c.name}: ${c.referred} referred, ${c.attended} attended, ${c.treated} treated (${pct(c.treated, c.referred)}%)`);
  }
  if (r.byWorker.length) {
    lines.push('', 'By health worker:');
    for (const w of r.byWorker) lines.push(`- ${w.name}: ${w.screenings} screenings, ${w.flagged} flagged, ${w.referrals} referred, ${w.treated} treated`);
  }
  return lines.join('\n');
}
