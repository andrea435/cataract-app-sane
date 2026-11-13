import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { File } from 'expo-file-system';
import type { Session } from '@supabase/supabase-js';
import { supabase, EYE_CAPTURES_BUCKET, PHOTO_URL_TTL_SECONDS, manageAccounts } from '../lib/supabase';
import { colors } from '../theme/colors';
import { ClinicInput, ClinicRow, DisplayResult, Eye, ProfileRow, ReferralRow, ReferralStatus, ScanRow, WorkerSettingsRow, statusFields } from '../data/types';
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

export type NewAccount = { full_name: string; email: string; password: string };

interface ScreeningContextValue {
  // ---- sign-in ----
  /** False until the saved sign-in (if any) has been read on launch. */
  authReady: boolean;
  /** The signed-in person's profile, or null when signed out. */
  profile: ProfileRow | null;
  /** Set when someone signed in but has no profile (e.g. their clinic was removed). */
  accountError: string | null;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<Result>;
  /** True while no accounts exist yet, so the first person can set up an admin account. */
  checkNeedsSetup: () => Promise<boolean>;
  setupFirstAccount: (input: NewAccount & { region: string }) => Promise<Result>;

  // ---- accounts (health workers only) ----
  accounts: ProfileRow[];
  createWorker: (input: NewAccount & { region: string; is_admin: boolean }) => Promise<Result>;
  createClinicLogin: (clinicId: string, input: NewAccount) => Promise<Result>;
  removeAccount: (userId: string) => Promise<Result>;

  // ---- data ----
  history: ScanRow[];
  clinics: ClinicRow[];
  referrals: ReferralRow[];
  settings: WorkerSettingsRow | null;
  loading: boolean;
  loadError: boolean;
  refreshAll: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  /** Short-lived signed link for a private eye photo, once it has been fetched. */
  photoUrlFor: (path: string | null | undefined) => string | null;

  // clinics (managed by health workers)
  addClinic: (input: ClinicInput) => Promise<Result<ClinicRow>>;
  updateClinic: (id: string, input: ClinicInput) => Promise<Result>;
  deleteClinic: (id: string) => Promise<Result>;

  // referrals
  latestReferralFor: (patientId: string | null | undefined) => ReferralRow | undefined;
  sendReferral: (args: { patientId: string; scanId: string | null; clinicId: string; note: string }) => Promise<Result<ReferralRow>>;
  updateReferral: (id: string, patch: { status?: ReferralStatus; clinic_note?: string | null }) => Promise<Result>;

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
  const [authReady, setAuthReady] = useState(false);
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ProfileRow[]>([]);

  const [history, setHistory] = useState<ScanRow[]>([]);
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [settings, setSettings] = useState<WorkerSettingsRow | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('scan');

  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [eye, setEye] = useState<Eye>('Left');
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<DisplayResult | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [saving, setSaving] = useState(false);

  const userId = authSession?.user.id ?? null;

  // ---------------------------------------------------------------- sign-in

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthSession(data.session);
      if (!data.session) setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAuthSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const clearData = useCallback(() => {
    setProfile(null);
    setAccounts([]);
    setHistory([]);
    setClinics([]);
    setReferrals([]);
    setSettings(null);
    setPhotoUrls({});
    setLoadError(false);
    setLoading(true);
    setActiveTab('scan');
  }, []);

  // Load the profile of whoever is signed in.
  useEffect(() => {
    if (!userId) {
      clearData();
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (cancelled) return;
      if (error) {
        // Offline at launch: keep the session; screens show the retry banner.
        setLoadError(true);
        setAuthReady(true);
        return;
      }
      if (!data) {
        setAccountError('This account no longer has access. Ask a health worker to add you again.');
        await supabase.auth.signOut();
      } else {
        setAccountError(null);
        setProfile(data as ProfileRow);
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, clearData]);

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    setAccountError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (!error) return { ok: true, value: undefined };
    if (/invalid login credentials/i.test(error.message)) return { ok: false, error: 'Wrong email or password.' };
    return { ok: false, error: NETWORK_ERROR };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const changePassword = useCallback(async (password: string): Promise<Result> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) return { ok: true, value: undefined };
    if (/different from the old/i.test(error.message)) return { ok: false, error: 'Choose a password different from your current one.' };
    if (/weak|short|characters/i.test(error.message)) return { ok: false, error: 'That password is too weak. Use at least 8 characters.' };
    return { ok: false, error: NETWORK_ERROR };
  }, []);

  const checkNeedsSetup = useCallback(async () => {
    const res = await manageAccounts<{ needsSetup: boolean }>({ action: 'status' });
    return res.ok && res.data.needsSetup;
  }, []);

  const setupFirstAccount = useCallback(
    async (input: NewAccount & { region: string }): Promise<Result> => {
      const res = await manageAccounts({ action: 'bootstrap', ...input });
      if (!res.ok) return res;
      return signIn(input.email, input.password);
    },
    [signIn]
  );

  // ---------------------------------------------------------------- photos

  // The eye-captures bucket is private: fetch signed links for every photo in one call.
  const signPhotos = useCallback(async (paths: (string | null | undefined)[]) => {
    const unique = [...new Set(paths.filter((p): p is string => !!p))];
    if (unique.length === 0) return;
    const { data } = await supabase.storage.from(EYE_CAPTURES_BUCKET).createSignedUrls(unique, PHOTO_URL_TTL_SECONDS);
    if (!data) return;
    setPhotoUrls(prev => {
      const next = { ...prev };
      for (const item of data) if (item.path && item.signedUrl) next[item.path] = item.signedUrl;
      return next;
    });
  }, []);

  const photoUrlFor = useCallback((path: string | null | undefined) => (path ? photoUrls[path] ?? null : null), [photoUrls]);

  // ---------------------------------------------------------------- loading

  const loadReferrals = useCallback(async () => {
    const res = await supabase.from('referrals').select(REFERRAL_SELECT).order('created_at', { ascending: false });
    if (res.data) {
      const rows = res.data as ReferralRow[];
      setReferrals(rows);
      signPhotos(rows.map(r => r.scan?.photo_path));
    }
    return !res.error;
  }, [signPhotos]);

  const refreshAll = useCallback(async () => {
    if (!profile) return;
    try {
      if (profile.role === 'clinic') {
        // Clinic staff only ever see their own clinic and its referrals (enforced by the database).
        const [clinicsRes, referralsOk] = await Promise.all([supabase.from('clinics').select('*'), loadReferrals()]);
        if (clinicsRes.data) setClinics(clinicsRes.data as ClinicRow[]);
        setLoadError(!!clinicsRes.error || !referralsOk);
        return;
      }
      const [historyRes, clinicsRes, settingsRes, accountsRes, referralsOk] = await Promise.all([
        supabase.from('scans').select(SCAN_SELECT).order('scanned_at', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('clinics').select('*').order('name', { ascending: true }),
        supabase.from('worker_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        loadReferrals(),
      ]);
      if (historyRes.data) {
        const rows = historyRes.data as ScanRow[];
        setHistory(rows);
        signPhotos(rows.map(r => r.photo_path));
      }
      if (clinicsRes.data) setClinics(clinicsRes.data as ClinicRow[]);
      if (settingsRes.data) setSettings(settingsRes.data as WorkerSettingsRow);
      if (accountsRes.data) setAccounts(accountsRes.data as ProfileRow[]);
      setLoadError(!!(historyRes.error || clinicsRes.error || !referralsOk));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [profile, loadReferrals, signPhotos]);

  useEffect(() => {
    if (profile) refreshAll();
    // Only when the signed-in person changes; refreshAll itself changes with profile edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // Live updates: when a clinic marks a patient attended/treated (or a worker sends a new
  // referral), every open app picks it up without a manual refresh. The database only
  // sends each person the rows they're allowed to see.
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`referrals-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => {
        loadReferrals();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, loadReferrals]);

  // Keep the patient's status on History rows in step with their latest referral.
  const syncPatientStatus = useCallback((patientId: string, status: ReferralStatus) => {
    setHistory(prev =>
      prev.map(s => (s.patient_record_id === patientId && s.patient ? { ...s, patient: { ...s.patient, referral_status: status } } : s))
    );
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!profile) return;
    const next = !profile.notifications_enabled;
    setProfile({ ...profile, notifications_enabled: next });
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', profile.id);
  }, [profile]);

  // ---------------------------------------------------------------- accounts

  const createWorker = useCallback(
    async (input: NewAccount & { region: string; is_admin: boolean }): Promise<Result> => {
      const res = await manageAccounts<{ profile: ProfileRow }>({ action: 'create_worker', ...input });
      if (!res.ok) return res;
      setAccounts(prev => [...prev, res.data.profile].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      return { ok: true, value: undefined };
    },
    []
  );

  const createClinicLogin = useCallback(async (clinicId: string, input: NewAccount): Promise<Result> => {
    const res = await manageAccounts<{ profile: ProfileRow }>({ action: 'create_clinic_user', clinic_id: clinicId, ...input });
    if (!res.ok) return res;
    setAccounts(prev => [...prev, res.data.profile].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    return { ok: true, value: undefined };
  }, []);

  const removeAccount = useCallback(async (id: string): Promise<Result> => {
    const res = await manageAccounts({ action: 'delete_user', user_id: id });
    if (!res.ok) return res;
    setAccounts(prev => prev.filter(a => a.id !== id));
    return { ok: true, value: undefined };
  }, []);

  // ---------------------------------------------------------------- clinics

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
        error: error.code === FK_VIOLATION ? "This clinic has referrals, so it can't be removed. You can still edit its details." : NETWORK_ERROR,
      };
    }
    setClinics(prev => prev.filter(c => c.id !== id));
    // Its staff logins lose access with it.
    setAccounts(prev => prev.filter(a => a.clinic_id !== id));
    return { ok: true, value: undefined };
  }, []);

  // ---------------------------------------------------------------- referrals

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
          worker_name: profile?.full_name ?? 'Health worker',
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
    [profile, syncPatientStatus]
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

  // ---------------------------------------------------------------- screening draft

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

  const viewHistoryItem = useCallback(
    (row: ScanRow) => {
      setCurrentResult({
        id: row.id,
        name: row.patient_name,
        eyeLabel: row.eye_label,
        date: formatScannedAt(row.scanned_at),
        probability: row.probability,
        photoUri: photoUrlFor(row.photo_path),
        status: statusFields(row.probability, colors),
      });
      setViewOnly(true);
    },
    [photoUrlFor]
  );

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
          worker_name: profile?.full_name ?? 'Health worker',
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
              // Show the local copy straight away; it is re-signed on the next refresh.
              setPhotoUrls(prev => ({ ...prev, [path]: capturedPhotoUri }));
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
  }, [currentResult, history, patientId, capturedPhotoUri, profile, resetDraft]);

  const value = useMemo<ScreeningContextValue>(
    () => ({
      authReady, profile, accountError, signIn, signOut, changePassword, checkNeedsSetup, setupFirstAccount,
      accounts, createWorker, createClinicLogin, removeAccount,
      history, clinics, referrals, settings, loading, loadError, refreshAll, toggleNotifications, photoUrlFor,
      addClinic, updateClinic, deleteClinic,
      latestReferralFor, sendReferral, updateReferral,
      activeTab, setActiveTab,
      patientName, setPatientName, patientId, setPatientId, eye, setEye,
      disclaimerChecked, setDisclaimerChecked, capturedPhotoUri, setCapturedPhotoUri, resetDraft,
      currentResult, viewOnly, computeCurrentResult, viewHistoryItem,
      saving, finishAndSave,
    }),
    [
      authReady, profile, accountError, signIn, signOut, changePassword, checkNeedsSetup, setupFirstAccount,
      accounts, createWorker, createClinicLogin, removeAccount,
      history, clinics, referrals, settings, loading, loadError, refreshAll, toggleNotifications, photoUrlFor,
      addClinic, updateClinic, deleteClinic,
      latestReferralFor, sendReferral, updateReferral,
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
