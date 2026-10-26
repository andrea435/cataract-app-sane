import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { File } from 'expo-file-system';
import { supabase, EYE_CAPTURES_BUCKET } from '../lib/supabase';
import { colors } from '../theme/colors';
import { ClinicRow, DisplayResult, Eye, ReferralStatus, ScanRow, WorkerSettingsRow, statusFields } from '../data/types';
import { formatDate, formatScannedAt } from '../data/format';

export type TabKey = 'scan' | 'history' | 'clinics' | 'profile';

// Scans come back with their linked patient embedded.
const SCAN_SELECT = '*, patient:patients(*)';

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
  settings: WorkerSettingsRow | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  bookClinic: (id: string) => Promise<void>;
  toggleNotifications: () => Promise<void>;
  setReferralStatus: (patientId: string, status: ReferralStatus | null) => Promise<void>;

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
  finishAndSave: () => Promise<void>;
}

const ScreeningContext = createContext<ScreeningContextValue | null>(null);

export function ScreeningProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanRow[]>([]);
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [settings, setSettings] = useState<WorkerSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabKey>('scan');

  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [eye, setEye] = useState<Eye>('Left');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<DisplayResult | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [saving, setSaving] = useState(false);

  const refreshAll = useCallback(async () => {
    const [historyRes, clinicsRes, settingsRes] = await Promise.all([
      supabase.from('scans').select(SCAN_SELECT).order('scanned_at', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('clinics').select('*').order('distance', { ascending: true }),
      supabase.from('worker_settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (historyRes.data) setHistory(historyRes.data as ScanRow[]);
    if (clinicsRes.data) setClinics(clinicsRes.data as ClinicRow[]);
    if (settingsRes.data) setSettings(settingsRes.data as WorkerSettingsRow);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const bookClinic = useCallback(async (id: string) => {
    setClinics(prev => prev.map(c => (c.id === id ? { ...c, booked_at: new Date().toISOString() } : c)));
    await supabase.from('clinics').update({ booked_at: new Date().toISOString() }).eq('id', id);
  }, []);

  const toggleNotifications = useCallback(async () => {
    const next = !(settings?.notifications_enabled ?? true);
    setSettings(prev => (prev ? { ...prev, notifications_enabled: next } : prev));
    await supabase.from('worker_settings').update({ notifications_enabled: next }).eq('id', 1);
  }, [settings]);

  const setReferralStatus = useCallback(async (patientId: string, status: ReferralStatus | null) => {
    // A patient can have several scans; keep every history row in sync.
    setHistory(prev =>
      prev.map(s => (s.patient_record_id === patientId && s.patient ? { ...s, patient: { ...s.patient, referral_status: status } } : s))
    );
    await supabase.from('patients').update({ referral_status: status }).eq('id', patientId);
  }, []);

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

  const finishAndSave = useCallback(async () => {
    const r = currentResult;
    if (!r) return;
    if (r.id) {
      // Already-saved historical record being re-viewed: nothing new to persist.
      resetDraft();
      return;
    }
    setSaving(true);
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
        setHistory(prev => [{ ...(inserted as ScanRow), photo_path: photoPath }, ...prev]);
      }
    } finally {
      setSaving(false);
      resetDraft();
    }
  }, [currentResult, patientId, capturedPhotoUri, settings, resetDraft]);

  const value = useMemo<ScreeningContextValue>(
    () => ({
      history, clinics, settings, loading, refreshAll, bookClinic, toggleNotifications, setReferralStatus,
      activeTab, setActiveTab,
      patientName, setPatientName, patientId, setPatientId, eye, setEye,
      disclaimerChecked, setDisclaimerChecked, capturedPhotoUri, setCapturedPhotoUri, resetDraft,
      currentResult, viewOnly, computeCurrentResult, viewHistoryItem,
      saving, finishAndSave,
    }),
    [
      history, clinics, settings, loading, refreshAll, bookClinic, toggleNotifications, setReferralStatus,
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
