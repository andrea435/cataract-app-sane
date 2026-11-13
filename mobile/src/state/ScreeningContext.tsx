import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { File } from 'expo-file-system';
import { supabase, EYE_CAPTURES_BUCKET } from '../lib/supabase';
import { colors } from '../theme/colors';
import { ClinicInput, ClinicRow, DisplayResult, Eye, ReferralRow, ReferralStatus, ScanRow, WorkerSettingsRow, statusFields } from '../data/types';
import { Session, loadSession, saveSession } from './session';
import { formatDate, formatScannedAt } from '../data/format';

export type TabKey = 'scan' | 'history' | 'clinics' | 'profile';

// Scans come back with their linked patient embedded.
const SCAN_SELECT = '*, patient:patients(*)';
// Referrals come back with the patient, the screening behind them and the clinic's name.
const REFERRAL_SELECT = '*, patient:patients(*), scan:scans(*), clinic:clinics(id, name)';

// Postgres foreign-key violation: the clinic still has referrals pointing at it.
const FK_VIOLATION = '23503';

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

function publicPhotoUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(EYE_CAPTURES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function toDisplayResult(row: ScanRow): DisplayResult {
  return {
    id: row.id,
    name: row.patient_name,
    eyeLabel: row.eye_label,
    date: formatScannedAt(row.scanned_at),
    probability: row.probability,
    photoUri: publicPhotoUrl(row.photo_path),
    status: statusFields(row.probability, colors),
  };
}

interface ScreeningContextValue {
  history: ScanRow[];
  clinics: ClinicRow[];
  referrals: ReferralRow[];
  settings: WorkerSettingsRow | null;
  loading: boolean;
  loadError: boolean;
  refreshAll: () => Promise<void>;
  toggleNotifications: () => Promise<void>;

  // clinics (managed by health workers)
  addClinic: (input: ClinicInput) => Promise<Result<ClinicRow>>;
  updateClinic: (id: string, input: ClinicInput) => Promise<Result>;
  deleteClinic: (id: string) => Promise<Result>;

  // referrals
  latestReferralFor: (patientId: string | null | undefined) => ReferralRow | undefined;
  sendReferral: (args: { patientId: string; scanId: string | null; clinicId: string; note: string }) => Promise<Result<ReferralRow>>;
  updateReferral: (id: string, patch: { status?: ReferralStatus; clinic_note?: string | null }) => Promise<Result>;

  // who is using this phone: a health worker, or staff of one clinic
  session: Session;
  signInClinic: (clinicId: string, code: string) => boolean;
  signOut: () => void;

  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;

  // in-progress screening draft
  patientName: string;
  setPatientName: (v: string) => void;
  patientId: string;
  setPatientId: (v: string) => void;
  eye: Eye;
  setEye: (v: Eye) => void;
  disclaimerChecked: boolean;
  setDisclaimerChecked: (v: boolean) => void;
  capturedPhotoUri: string | null;
  setCapturedPhotoUri: (v: string | null) => void;
  resetDraft: () => void;

  currentResult: DisplayResult | null;
  viewOnly: boolean;
  computeCurrentResult: () => void;
  viewHistoryItem: (row: ScanRow) => void;

  saving: boolean;
  finishAndSave: () => Promise<ScanRow | null>;
}

const ScreeningContext = createContext<ScreeningContextValue | null>(null);

export function ScreeningProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanRow[]>([]);
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [settings, setSettings] = useState<WorkerSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [session, setSession] = useState<Session>(loadSession);

  const [activeTab, setActiveTab] = useState<TabKey>('scan');

  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [eye, setEye] = useState<Eye>('Left');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<DisplayResult | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [saving, setSaving] = useState(false);

  const loadReferrals = useCallback(async () => {
    const res = await supabase.from('referrals').select(REFERRAL_SELECT).order('created_at', { ascending: false });
    if (res.data) setReferrals(res.data as ReferralRow[]);
    return !res.error;
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [historyRes, clinicsRes, settingsRes, referralsOk] = await Promise.all([
        supabase.from('scans').select(SCAN_SELECT).order('scanned_at', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('clinics').select('*').order('name', { ascending: true }),
        supabase.from('worker_settings').select('*').eq('id', 1).maybeSingle(),
        loadReferrals(),
      ]);
      if (historyRes.data) setHistory(historyRes.data as ScanRow[]);
      if (clinicsRes.data) setClinics(clinicsRes.data as ClinicRow[]);
      if (settingsRes.data) setSettings(settingsRes.data as WorkerSettingsRow);
      setLoadError(!!(historyRes.error || clinicsRes.error || !referralsOk));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [loadReferrals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Live updates: when a clinic marks a patient attended/treated (or a worker sends a new
  // referral), every open app picks it up without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel('referrals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        loadReferrals();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReferrals]);

  // Keep the patient's status on History rows in step with their latest referral.
  const syncPatientStatus = useCallback((patientId: string, status: ReferralStatus) => {
    setHistory(prev =>
      prev.map(s => (s.patient_record_id === patientId && s.patient ? { ...s, patient: { ...s.patient, referral_status: status } } : s))
    );
  }, []);

  const addClinic = useCallback(async (input: ClinicInput): Promise<Result<ClinicRow>> => {
    const { data, error } = await supabase.from('clinics').insert(input).select('*').single();
    if (error || !data) return { ok: false, error: NETWORK_ERROR };
    setClinics(prev => [...prev, data as ClinicRow].sort((a, b) => a.name.localeCompare(b.name)));
    return { ok: true, value: data as ClinicRow };
  }, []);

  const updateClinic = useCallback(async (id: string, input: ClinicInput): Promise<Result> => {
    const { error } = await supabase.from('clinics').update(input).eq('id', id);
    if (error) return { ok: false, error: NETWORK_ERROR };
    setClinics(prev => prev.map(c => (c.id === id ? { ...c, ...input } : c)).sort((a, b) => a.name.localeCompare(b.name)));
    // Referral cards show the clinic name, so refresh them too.
    setReferrals(prev => prev.map(r => (r.clinic_id === id ? { ...r, clinic: { id, name: input.name } } : r)));
    return { ok: true, value: undefined };
  }, []);

  const deleteClinic = useCallback(async (id: string): Promise<Result> => {
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) {
      return {
        ok: false,
        error: error.code === FK_VIOLATION ? 'This clinic has referrals, so it can\'t be removed. You can still edit its details.' : NETWORK_ERROR,
      };
    }
    setClinics(prev => prev.filter(c => c.id !== id));
    return { ok: true, value: undefined };
  }, []);

  const latestReferralFor = useCallback(
    (patientId: string | null | undefined) => (patientId ? referrals.find(r => r.patient_id === patientId) : undefined),
    [referrals]
  );

  const sendReferral = useCallback(
    async ({ patientId, scanId, clinicId, note }: { patientId: string; scanId: string | null; clinicId: string; note: string }): Promise<Result<ReferralRow>> => {
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          patient_id: patientId,
          scan_id: scanId,
          clinic_id: clinicId,
          worker_name: settings?.worker_name ?? 'Naomi Achieng',
          worker_note: note.trim() || null,
        })
        .select(REFERRAL_SELECT)
        .single();
      if (error || !data) return { ok: false, error: NETWORK_ERROR };
      const row = data as ReferralRow;
      setReferrals(prev => [row, ...prev.filter(r => r.id !== row.id)]);
      syncPatientStatus(patientId, row.status);
      return { ok: true, value: row };
    },
    [settings, syncPatientStatus]
  );

  const updateReferral = useCallback(
    async (id: string, patch: { status?: ReferralStatus; clinic_note?: string | null }): Promise<Result> => {
      const before = referrals.find(r => r.id === id);
      setReferrals(prev => prev.map(r => (r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r)));
      if (before && patch.status) syncPatientStatus(before.patient_id, patch.status);
      const { error } = await supabase.from('referrals').update(patch).eq('id', id);
      if (error) {
        // Roll back the optimistic change so the screen shows what is really stored.
        if (before) {
          setReferrals(prev => prev.map(r => (r.id === id ? before : r)));
          if (patch.status) syncPatientStatus(before.patient_id, before.status);
        }
        return { ok: false, error: NETWORK_ERROR };
      }
      return { ok: true, value: undefined };
    },
    [referrals, syncPatientStatus]
  );

  const signInClinic = useCallback(
    (clinicId: string, code: string) => {
      const clinic = clinics.find(c => c.id === clinicId);
      if (!clinic || clinic.access_code !== code.trim()) return false;
      const next: Session = { role: 'clinic', clinicId };
      setSession(next);
      saveSession(next);
      return true;
    },
    [clinics]
  );

  const signOut = useCallback(() => {
    const next: Session = { role: 'worker' };
    setSession(next);
    saveSession(next);
  }, []);

  const toggleNotifications = useCallback(async () => {
    const next = !(settings?.notifications_enabled ?? true);
    setSettings(prev => (prev ? { ...prev, notifications_enabled: next } : prev));
    await supabase.from('worker_settings').update({ notifications_enabled: next }).eq('id', 1);
  }, [settings]);

  const resetDraft = useCallback(() => {
    setPatientName('');
    setPatientId('');
    setEye('Left');
    setDisclaimerChecked(false);
    setCapturedPhotoUri(null);
    setCurrentResult(null);
    setViewOnly(false);
  }, []);

  const computeCurrentResult = useCallback(() => {
    const probability = Math.floor(Math.random() * 90) + 8;
    const result: DisplayResult = {
      id: null,
      name: patientName.trim() || 'Patient',
      eyeLabel: `${eye} eye`,
      date: formatDate(new Date()),
      probability,
      photoUri: capturedPhotoUri,
      status: statusFields(probability, colors),
    };
    setCurrentResult(result);
    setViewOnly(false);
  }, [patientName, eye, capturedPhotoUri]);

  const viewHistoryItem = useCallback((row: ScanRow) => {
    setCurrentResult(toDisplayResult(row));
    setViewOnly(true);
  }, []);

  const finishAndSave = useCallback(async (): Promise<ScanRow | null> => {
    const r = currentResult;
    if (!r) return null;
    if (r.id) {
      // Already-saved historical record being re-viewed: nothing new to persist.
      resetDraft();
      return history.find(h => h.id === r.id) ?? null;
    }
    setSaving(true);
    let saved: ScanRow | null = null;
    try {
      // Reuse the patient record when the worker entered a known patient ID; otherwise create one.
      const externalId = patientId.trim() || null;
      const { data: patient } = await supabase
        .from('patients')
        .upsert({ name: r.name, external_id: externalId }, { onConflict: 'external_id' })
        .select('id')
        .single();

      const { data: inserted, error } = await supabase
        .from('scans')
        .insert({
          patient_record_id: patient?.id ?? null,
          patient_name: r.name,
          patient_id: externalId,
          eye_label: r.eyeLabel,
          scanned_at: new Date().toISOString().slice(0, 10),
          probability: r.probability,
          detected: r.status.detected,
          severity: r.status.severity,
          worker_name: settings?.worker_name ?? 'Naomi Achieng',
        })
        .select(SCAN_SELECT)
        .single();

      if (!error && inserted) {
        let photoPath: string | null = null;
        if (capturedPhotoUri) {
          try {
            const file = new File(capturedPhotoUri);
            const bytes = await file.arrayBuffer();
            const path = `${inserted.id}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from(EYE_CAPTURES_BUCKET)
              .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
            if (!uploadError) {
              photoPath = path;
              await supabase.from('scans').update({ photo_path: path }).eq('id', inserted.id);
            }
          } catch {
            // Photo upload is best-effort; the scan record itself is already saved.
          }
        }
        saved = { ...(inserted as ScanRow), photo_path: photoPath };
        setHistory(prev => [saved as ScanRow, ...prev]);
      }
    } finally {
      setSaving(false);
      resetDraft();
    }
    return saved;
  }, [currentResult, history, patientId, capturedPhotoUri, settings, resetDraft]);

  const value = useMemo<ScreeningContextValue>(
    () => ({
      history, clinics, referrals, settings, loading, loadError, refreshAll, toggleNotifications,
      addClinic, updateClinic, deleteClinic,
      latestReferralFor, sendReferral, updateReferral,
      session, signInClinic, signOut,
      activeTab, setActiveTab,
      patientName, setPatientName, patientId, setPatientId, eye, setEye,
      disclaimerChecked, setDisclaimerChecked, capturedPhotoUri, setCapturedPhotoUri, resetDraft,
      currentResult, viewOnly, computeCurrentResult, viewHistoryItem,
      saving, finishAndSave,
    }),
    [
      history, clinics, referrals, settings, loading, loadError, refreshAll, toggleNotifications,
      addClinic, updateClinic, deleteClinic,
      latestReferralFor, sendReferral, updateReferral,
      session, signInClinic, signOut,
      activeTab,
      patientName, patientId, eye, disclaimerChecked, capturedPhotoUri, resetDraft,
      currentResult, viewOnly, computeCurrentResult, viewHistoryItem,
      saving, finishAndSave,
    ]
  );

  return <ScreeningContext.Provider value={value}>{children}</ScreeningContext.Provider>;
}

export function useScreening() {
  const ctx = useContext(ScreeningContext);
  if (!ctx) throw new Error('useScreening must be used within ScreeningProvider');
  return ctx;
}
