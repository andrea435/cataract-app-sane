import { ReferralRow, WorkerSettingsRow } from './types';

// Follow-up reminders: a referred patient who hasn't reached the clinic after N days.

export const DEFAULT_FOLLOW_UP_DAYS = 14;
export const FOLLOW_UP_CHOICES = [7, 14, 21, 30];

const DAY_MS = 86400000;

export function followUpDays(settings: WorkerSettingsRow | null): number {
  return settings?.follow_up_days ?? DEFAULT_FOLLOW_UP_DAYS;
}

/** Whole days since the referral was sent. */
export function daysSinceReferral(r: ReferralRow, now = Date.now()): number {
  return Math.max(0, Math.floor((now - Date.parse(r.created_at)) / DAY_MS));
}

/** Whole days the reminder has been counting (since sending, or the last follow-up). */
function daysCounting(r: ReferralRow, now: number): number {
  return Math.floor((now - Date.parse(r.followed_up_at ?? r.created_at)) / DAY_MS);
}

/** Still "referred" (not attended) and the reminder period has passed. */
export function isFollowUpDue(r: ReferralRow, days: number, now = Date.now()): boolean {
  return r.status === 'referred' && !r.pending && daysCounting(r, now) >= days;
}

/** Overdue referrals, longest waiting first. */
export function dueFollowUps(referrals: ReferralRow[], days: number, now = Date.now()): ReferralRow[] {
  return referrals.filter(r => isFollowUpDue(r, days, now)).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export function daysLabel(n: number): string {
  return n === 1 ? '1 day' : `${n} days`;
}
