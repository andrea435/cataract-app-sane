export type Eye = 'Left' | 'Right';

export type ReferralStatus = 'referred' | 'attended' | 'treated';

export const REFERRAL_STATUSES: { value: ReferralStatus; label: string }[] = [
  { value: 'referred', label: 'Referred' },
  { value: 'attended', label: 'Attended' },
  { value: 'treated', label: 'Treated' },
];

export function referralLabel(status: ReferralStatus | null): string {
  return REFERRAL_STATUSES.find(s => s.value === status)?.label ?? 'Not referred';
}

export interface PatientRow {
  id: string;
  name: string;
  external_id: string | null;
  referral_status: ReferralStatus | null;
  created_at: string;
}

export interface ScanRow {
  id: string;
  patient_name: string;
  patient_id: string | null;
  eye_label: string;
  scanned_at: string;
  probability: number;
  detected: boolean;
  severity: string | null;
  photo_path: string | null;
  worker_name: string;
  patient_record_id: string | null;
  patient: PatientRow | null;
  created_at: string;
}

export interface ClinicRow {
  id: string;
  name: string;
  distance: string | null;
  address: string | null;
  phone: string | null;
  booked_at: string | null;
  created_at: string;
}

export type ClinicInput = Pick<ClinicRow, 'name' | 'address' | 'phone' | 'distance'>;

/** A signed-in person: a health worker, or staff of one clinic. */
export interface ProfileRow {
  id: string;
  role: 'worker' | 'clinic';
  clinic_id: string | null;
  full_name: string;
  email: string;
  region: string | null;
  is_admin: boolean;
  notifications_enabled: boolean;
  created_at: string;
}

export interface ReferralRow {
  id: string;
  patient_id: string;
  scan_id: string | null;
  clinic_id: string;
  status: ReferralStatus;
  worker_name: string;
  worker_note: string | null;
  clinic_note: string | null;
  created_at: string;
  updated_at: string;
  patient: PatientRow | null;
  scan: Omit<ScanRow, 'patient'> | null;
  clinic: Pick<ClinicRow, 'id' | 'name'> | null;
}

/** Index of a status along the referred → attended → treated path (-1 if not referred). */
export function referralStep(status: ReferralStatus | null): number {
  return REFERRAL_STATUSES.findIndex(s => s.value === status);
}

export function nextReferralStatus(status: ReferralStatus): ReferralStatus | null {
  return REFERRAL_STATUSES[referralStep(status) + 1]?.value ?? null;
}

/** A readable temporary password for a new account, e.g. "lake-7342-river". */
export function suggestPassword(): string {
  const words = ['lake', 'river', 'hill', 'sun', 'cloud', 'tree', 'stone', 'field', 'bird', 'rain', 'star', 'road'];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  return `${pick()}-${String(Math.floor(1000 + Math.random() * 9000))}-${pick()}`;
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export interface WorkerSettingsRow {
  id: number;
  worker_name: string;
  worker_initials: string;
  worker_region: string;
  notifications_enabled: boolean;
  ai_model_version: string;
}

export interface StatusFields {
  detected: boolean;
  severity: 'Mild' | 'Moderate' | 'Severe' | null;
  statusColor: string;
  statusBg: string;
  statusLabel: string;
  statusLabelLower: string;
  dashOffset: number;
}

const RING_CIRCUMFERENCE = 364.4;

export function statusFields(probability: number, colors: { danger: string; dangerBg: string; success: string; successBg: string }): StatusFields {
  const detected = probability >= 50;
  const severity: StatusFields['severity'] = !detected
    ? null
    : probability >= 80
      ? 'Severe'
      : probability >= 65
        ? 'Moderate'
        : 'Mild';
  return {
    detected,
    severity,
    statusColor: detected ? colors.danger : colors.success,
    statusBg: detected ? colors.dangerBg : colors.successBg,
    statusLabel: detected ? 'Cataract detected' : 'No cataract detected',
    statusLabelLower: (detected ? 'Cataract detected' : 'No cataract detected').toLowerCase(),
    dashOffset: RING_CIRCUMFERENCE * (1 - probability / 100),
  };
}

export interface DisplayResult {
  id: string | null;
  name: string;
  eyeLabel: string;
  date: string;
  probability: number;
  photoUri: string | null;
  status: StatusFields;
}
