import { File } from 'expo-file-system';
import { supabase, EYE_CAPTURES_BUCKET } from '../lib/supabase';
import { dropPhoto } from '../lib/localStore';
import { ClinicRow, ReferralRow, ScanRow } from '../data/types';

// Offline mode. Every new screening and referral is first written to an "outbox" kept on the
// phone, then uploaded in order whenever there is signal. Records get their final id on the
// phone, so an upload that is retried after a dropped connection never creates a duplicate.

export const SCAN_SELECT = '*, patient:patients(*)';
export const REFERRAL_SELECT = '*, patient:patients(*), scan:scans(*), clinic:clinics(id, name)';

export interface ScanJob {
  kind: 'scan';
  id: string;
  /** Patient record id used when no Patient ID was typed (otherwise matched on the ID). */
  patientId: string;
  externalId: string | null;
  name: string;
  eyeLabel: string;
  scannedAt: string;
  probability: number;
  detected: boolean;
  severity: string | null;
  workerName: string;
  /** Copy of the photo in the app's folder, deleted once uploaded. */
  photoUri: string | null;
  /** The scan row is stored; only the photo is still to upload. */
  scanStored?: boolean;
  createdAt: string;
  /** Last reason the server refused it, shown to the health worker. */
  error?: string | null;
}

export interface ReferralJob {
  kind: 'referral';
  id: string;
  scanId: string | null;
  /** Known when the screening was already uploaded; otherwise looked up from the scan. */
  patientId: string | null;
  clinicId: string;
  note: string | null;
  workerName: string;
  createdAt: string;
  error?: string | null;
}

export type Job = ScanJob | ReferralJob;

export type UploadOutcome<T> = { kind: 'done'; row: T } | { kind: 'offline' } | { kind: 'rejected'; error: string };

type DbError = { code?: string; message?: string } | null;

const UNIQUE_VIOLATION = '23505';

/**
 * True when an error means "no connection" (or an expired sign-in that will renew once
 * there is signal), so the upload should simply be tried again later.
 */
export function isConnectionError(error: DbError): boolean {
  if (!error) return false;
  if (!error.code) return true; // fetch failed before reaching the database
  return /^PGRST3/.test(error.code) || /network|fetch|timed? ?out/i.test(error.message ?? '');
}

function outcome(error: DbError): { kind: 'offline' } | { kind: 'rejected'; error: string } {
  return isConnectionError(error) ? { kind: 'offline' } : { kind: 'rejected', error: error?.message || 'Refused by the server' };
}

/** How a waiting screening is shown in History before it has uploaded. */
export function pendingScanRow(job: ScanJob): ScanRow {
  return {
    id: job.id,
    patient_name: job.name,
    patient_id: job.externalId,
    eye_label: job.eyeLabel,
    scanned_at: job.scannedAt,
    probability: job.probability,
    detected: job.detected,
    severity: job.severity,
    photo_path: null,
    worker_name: job.workerName,
    patient_record_id: null,
    patient: null,
    created_at: job.createdAt,
    pending: true,
    local_photo_uri: job.photoUri,
  };
}

/** How a waiting referral is shown before it has been sent. */
export function pendingReferralRow(job: ReferralJob, scans: ScanRow[], clinics: ClinicRow[]): ReferralRow {
  const scan = job.scanId ? scans.find(s => s.id === job.scanId) : undefined;
  const clinic = clinics.find(c => c.id === job.clinicId);
  return {
    id: job.id,
    patient_id: job.patientId ?? scan?.patient_record_id ?? '',
    scan_id: job.scanId,
    clinic_id: job.clinicId,
    status: 'referred',
    worker_name: job.workerName,
    worker_note: job.note,
    clinic_note: null,
    created_at: job.createdAt,
    updated_at: job.createdAt,
    patient: scan
      ? { id: scan.patient_record_id ?? '', name: scan.patient_name, external_id: scan.patient_id, referral_status: 'referred', created_at: scan.created_at }
      : null,
    scan: scan ? { ...scan } : null,
    clinic: clinic ? { id: clinic.id, name: clinic.name } : null,
    pending: true,
  };
}

async function uploadPhoto(job: ScanJob): Promise<'done' | 'offline' | 'skipped'> {
  if (!job.photoUri) return 'skipped';
  let bytes: ArrayBuffer;
  try {
    bytes = await new File(job.photoUri).arrayBuffer();
  } catch {
    return 'skipped'; // the file is gone; the screening is still kept
  }
  const path = `${job.id}.jpg`;
  const { error } = await supabase.storage.from(EYE_CAPTURES_BUCKET).upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  // No HTTP status means the request never got an answer: try again later. A refusal
  // (e.g. a photo that is too large) is not retried; the screening is kept without it.
  if (error) return (error as { status?: number }).status ? 'skipped' : 'offline';
  const { error: linkError } = await supabase.from('scans').update({ photo_path: path }).eq('id', job.id);
  if (linkError) return isConnectionError(linkError) ? 'offline' : 'skipped';
  return 'done';
}

/** Uploads one screening: patient record, scan row, then photo. */
export async function uploadScan(job: ScanJob, onStored: () => void): Promise<UploadOutcome<ScanRow>> {
  if (!job.scanStored) {
    // Reuse the patient record when a Patient ID was typed; otherwise use the phone's id.
    const patientRes = job.externalId
      ? await supabase.from('patients').upsert({ name: job.name, external_id: job.externalId }, { onConflict: 'external_id' }).select('id').single()
      : await supabase.from('patients').upsert({ id: job.patientId, name: job.name, external_id: null }, { onConflict: 'id' }).select('id').single();
    if (patientRes.error || !patientRes.data) return outcome(patientRes.error);

    const { error } = await supabase.from('scans').insert({
      id: job.id,
      patient_record_id: patientRes.data.id,
      patient_name: job.name,
      patient_id: job.externalId,
      eye_label: job.eyeLabel,
      scanned_at: job.scannedAt,
      probability: job.probability,
      detected: job.detected,
      severity: job.severity,
      worker_name: job.workerName,
    });
    // Already there: an earlier attempt got through but its reply was lost.
    if (error && error.code !== UNIQUE_VIOLATION) return outcome(error);
    onStored();
  }

  const photo = await uploadPhoto(job);
  if (photo === 'offline') return { kind: 'offline' };

  const { data, error } = await supabase.from('scans').select(SCAN_SELECT).eq('id', job.id).single();
  if (error || !data) return outcome(error);
  dropPhoto(job.photoUri);
  return { kind: 'done', row: data as ScanRow };
}

/** Sends one referral. Its screening must have uploaded first (the outbox keeps that order). */
export async function uploadReferral(job: ReferralJob): Promise<UploadOutcome<ReferralRow>> {
  let patientId = job.patientId;
  if (!patientId && job.scanId) {
    const { data, error } = await supabase.from('scans').select('patient_record_id').eq('id', job.scanId).maybeSingle();
    if (error) return outcome(error);
    patientId = (data?.patient_record_id as string | null) ?? null;
  }
  if (!patientId) return { kind: 'rejected', error: "The screening for this referral hasn't uploaded yet." };

  const { error } = await supabase.from('referrals').insert({
    id: job.id,
    patient_id: patientId,
    scan_id: job.scanId,
    clinic_id: job.clinicId,
    worker_name: job.workerName,
    worker_note: job.note,
  });
  if (error && error.code !== UNIQUE_VIOLATION) return outcome(error);

  const { data, error: readError } = await supabase.from('referrals').select(REFERRAL_SELECT).eq('id', job.id).single();
  if (readError || !data) return outcome(readError);
  return { kind: 'done', row: data as ReferralRow };
}
