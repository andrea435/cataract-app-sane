export type Eye = 'Left' | 'Right';

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
  created_at: string;
}

export interface ClinicRow {
  id: string;
  name: string;
  distance: string;
  address: string;
  phone: string;
  booked_at: string | null;
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
