import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { supabase, EYE_CAPTURES_BUCKET, PHOTO_URL_TTL_SECONDS, manageAccounts, storedSessionUserId, forgetStoredSession } from '../lib/supabase';
import { keepPhoto, newId, readJson, writeJson } from '../lib/localStore';
import { Job, REFERRAL_SELECT, ReferralJob, SCAN_SELECT, ScanJob, isConnectionError, pendingReferralRow, pendingScanRow, uploadReferral, uploadScan } from './outbox';
import { colors } from '../theme/colors';
import { ClinicInput, ClinicRow, DisplayResult, Eye, ProfileRow, ReferralRow, ReferralStatus, ScanRow, WorkerSettingsRow, statusFields } from '../data/types';
import { formatDate, formatScannedAt } from '../data/format';

export type TabKey = 'scan' | 'history' | 'clinics' | 'profile';

// Postgres foreign-key violation: the clinic still has referrals pointing at it.
const FK_VIOLATION = '23503';

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

export type NewAccount = { full_name: string; email: string; password: string };

/** Offline mode: what is still waiting on this phone to upload. */
export interface SyncStatus {
  /** Screenings and referrals not uploaded yet. */
  waiting: number;
  /** Of those, how many the server refused (shown so they can be checked). */
  refused: number;
  syncing: boolean;
  lastSyncedAt: string | null;
}

// How long a save waits for the upload before carrying on with the copy on the phone.
const SAVE_WAIT_MS = 8000;
// While offline (or with uploads waiting), try again this often.
const RETRY_EVERY_MS = 30000;

// What is kept on the phone so the app opens and works without signal.
interface CachedData {
  profile: ProfileRow;
  history: ScanRow[];
  clinics: ClinicRow[];
  referrals: ReferralRow[];
  settings: WorkerSettingsRow | null;
  accounts: ProfileRow[];
  savedAt: string;
}

const cacheKey = (userId: string) => `cache-${userId}`;
const outboxKey = (userId: string) => `outbox-${userId}`;

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
  /** Offline mode: uploads waiting on this phone. */
  sync: SyncStatus;
  /** Try uploading what is waiting now. */
  syncNow: () => Promise<void>;

  // clinics (managed by health workers)
  addClinic: (input: ClinicInput) => Promise<Result<ClinicRow>>;
  updateClinic: (id: string, input: ClinicInput) => Promise<Result>;
  deleteClinic: (id: string) => Promise<Result>;

  // referrals
  latestReferralFor: (patientId: string | null | undefined) => ReferralRow | undefined;
  /** Sends a referral, or keeps it on the phone to send when there is signal (`queued`). */
  sendReferral: (args: { scan: ScanRow; clinicId: string; note: string }) => Promise<Result<{ row: ReferralRow; queued: boolean }>>;
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
  /** Saves the screening on the phone and uploads it when possible. The row returned is
   * `pending` while it is still waiting to upload. */
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

  // Offline mode.
  const [offlineUserId, setOfflineUserId] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<Job[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const outboxRef = useRef<Job[]>([]);
  const historyRef = useRef<ScanRow[]>([]);
  const syncPromise = useRef<Promise<void> | null>(null);
  historyRef.current = history;

  // Signed in on this phone. Without signal, once the hour-long access token has expired
  // Supabase reports no session until it can renew it, so fall back to the saved one.
  const userId = authSession?.user.id ?? offlineUserId;

  // ---------------------------------------------------------------- sign-in

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      setAuthSession(data.session);
      if (data.session) return;
      const stored = error && isAuthRetryableFetchError(error) ? storedSessionUserId() : null;
      setOfflineUserId(stored);
      if (!stored) setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthSession(session);
      if (session || event === 'SIGNED_OUT') setOfflineUserId(null);
    });
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
    setOutbox([]);
    outboxRef.current = [];
    setLastSyncedAt(null);
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

    // Open straight away with what was saved on the phone last time, then check online.
    const cached = readJson<CachedData>(cacheKey(userId));
    if (cached?.profile?.id === userId) {
      setProfile(cached.profile);
      setHistory(cached.history ?? []);
      setClinics(cached.clinics ?? []);
      setReferrals(cached.referrals ?? []);
      setSettings(cached.settings ?? null);
      setAccounts(cached.accounts ?? []);
      setLoading(false);
      setAuthReady(true);
    }
    const waiting = readJson<Job[]>(outboxKey(userId)) ?? [];
    outboxRef.current = waiting;
    setOutbox(waiting);

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      // No signal: forget the sign-in on this phone anyway. Anything still waiting to
      // upload stays saved for this account and uploads when they sign in again.
      forgetStoredSession();
      setAuthSession(null);
      setOfflineUserId(null);
    }
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
    // Without a live session the server would answer as a stranger (with nothing), so don't
    // replace what's on the phone. getSession renews an expired sign-in when it can.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoadError(true);
      setLoading(false);
      return;
    }
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
      const failed = !!(historyRes.error || clinicsRes.error || !referralsOk);
      setLoadError(failed);
      if (!failed && outboxRef.current.length > 0) syncNowRef.current();
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
  const syncPatientStatusRef = useRef(syncPatientStatus);

  // ---------------------------------------------------------------- offline mode

  // Keep a copy of the latest server data on the phone (only what came from the server;
  // things still waiting to upload live in the outbox).
  useEffect(() => {
    if (!profile || loading) return;
    const t = setTimeout(() => {
      writeJson(cacheKey(profile.id), { profile, history, clinics, referrals, settings, accounts, savedAt: new Date().toISOString() } satisfies CachedData);
    }, 400);
    return () => clearTimeout(t);
  }, [profile, loading, history, clinics, referrals, settings, accounts]);

  const saveOutbox = useCallback(
    (next: Job[]) => {
      outboxRef.current = next;
      setOutbox(next);
      if (userId) writeJson(outboxKey(userId), next);
    },
    [userId]
  );

  const updateJob = useCallback(
    (id: string, patch: Partial<ScanJob> | Partial<ReferralJob>) => {
      saveOutbox(outboxRef.current.map(j => (j.id === id ? ({ ...j, ...patch } as Job) : j)));
    },
    [saveOutbox]
  );

  // Upload waiting jobs oldest first. Stops at the first connection failure so a referral
  // never goes ahead of its screening; a job the server refuses is kept and marked.
  const runSync = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const tried = new Set<string>();
    setSyncing(true);
    try {
      for (;;) {
        const job = outboxRef.current.find(j => !tried.has(j.id));
        if (!job) break;
        tried.add(job.id);
        if (job.kind === 'scan') {
          const res = await uploadScan(job, () => updateJob(job.id, { scanStored: true }));
          if (res.kind === 'offline') break;
          if (res.kind === 'rejected') {
            updateJob(job.id, { error: res.error });
            continue;
          }
          saveOutbox(outboxRef.current.filter(j => j.id !== job.id));
          setHistory(prev => [res.row, ...prev.filter(h => h.id !== res.row.id)]);
          // Show the phone's copy of the photo until the next refresh signs the uploaded one.
          if (res.row.photo_path && job.photoUri) setPhotoUrls(prev => ({ ...prev, [res.row.photo_path as string]: job.photoUri as string }));
          else if (res.row.photo_path) signPhotos([res.row.photo_path]);
        } else {
          const res = await uploadReferral(job);
          if (res.kind === 'offline') break;
          if (res.kind === 'rejected') {
            updateJob(job.id, { error: res.error });
            continue;
          }
          saveOutbox(outboxRef.current.filter(j => j.id !== job.id));
          setReferrals(prev => [res.row, ...prev.filter(r => r.id !== res.row.id)]);
          syncPatientStatusRef.current(res.row.patient_id, res.row.status);
        }
      }
      if (outboxRef.current.every(j => tried.has(j.id) && !j.error) || outboxRef.current.length === 0) {
        setLastSyncedAt(new Date().toISOString());
      }
    } finally {
      setSyncing(false);
    }
  }, [saveOutbox, updateJob, signPhotos]);

  // One upload run at a time; callers share the run in progress.
  const syncNow = useCallback(() => {
    if (!syncPromise.current) {
      syncPromise.current = runSync()
        .catch(() => undefined)
        .finally(() => {
          syncPromise.current = null;
        });
    }
    return syncPromise.current;
  }, [runSync]);
  const syncNowRef = useRef(syncNow);
  syncNowRef.current = syncNow;

  /** Waits for an upload run, but no longer than `SAVE_WAIT_MS` on a slow connection. */
  const syncWithin = useCallback(
    () => Promise.race([syncNow(), new Promise<void>(resolve => setTimeout(resolve, SAVE_WAIT_MS))]),
    [syncNow]
  );

  // Without signal, keep trying: on a timer, and whenever the app comes back to the front.
  const needsRetry = !!profile && (loadError || outbox.length > 0);
  useEffect(() => {
    if (!needsRetry) return;
    const retry = () => (loadError ? refreshAll() : syncNow());
    const timer = setInterval(retry, RETRY_EVERY_MS);
    const sub = AppState.addEventListener('change', state => state === 'active' && retry());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [needsRetry, loadError, refreshAll, syncNow]);

  const sync = useMemo<SyncStatus>(
    () => ({ waiting: outbox.length, refused: outbox.filter(j => j.error).length, syncing, lastSyncedAt }),
    [outbox, syncing, lastSyncedAt]
  );

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

  // Lists shown on screen: what's waiting on the phone first, then what's on the server.
  const historyIds = useMemo(() => new Set(history.map(h => h.id)), [history]);
  const pendingRows = useMemo(() => {
    const scans = outbox.filter((j): j is ScanJob => j.kind === 'scan' && !historyIds.has(j.id)).map(pendingScanRow).reverse();
    const allScans = [...scans, ...history];
    const refs = outbox.filter((j): j is ReferralJob => j.kind === 'referral').map(j => pendingReferralRow(j, allScans, clinics)).reverse();
    return { scans, refs };
  }, [outbox, history, historyIds, clinics]);
  const shownHistory = useMemo(() => [...pendingRows.scans, ...history], [pendingRows, history]);
  const shownReferrals = useMemo(() => [...pendingRows.refs, ...referrals], [pendingRows, referrals]);

  // ---------------------------------------------------------------- referrals

  const latestReferralFor = useCallback(
    (patientId: string | null | undefined) => (patientId ? shownReferrals.find(r => r.patient_id === patientId) : undefined),
    [shownReferrals]
  );

  const sendReferral = useCallback(
    async ({ scan, clinicId, note }: { scan: ScanRow; clinicId: string; note: string }): Promise<Result<{ row: ReferralRow; queued: boolean }>> => {
      const job: ReferralJob = {
        kind: 'referral',
        id: newId(),
        scanId: scan.id,
        patientId: scan.patient_record_id,
        clinicId,
        note: note.trim() || null,
        workerName: profile?.full_name ?? 'Health worker',
        createdAt: new Date().toISOString(),
      };
      saveOutbox([...outboxRef.current, job]);
      await syncWithin();
      const stillWaiting = outboxRef.current.find(j => j.id === job.id);
      if (!stillWaiting) {
        const row = referrals.find(r => r.id === job.id);
        return { ok: true, value: { row: row ?? pendingReferralRow(job, historyRef.current, clinics), queued: false } };
      }
      if (stillWaiting.error && !scan.pending) {
        // Online and refused: say so now rather than keeping a referral that will never go.
        saveOutbox(outboxRef.current.filter(j => j.id !== job.id));
        return { ok: false, error: NETWORK_ERROR };
      }
      return { ok: true, value: { row: pendingReferralRow(job, historyRef.current, clinics), queued: true } };
    },
    [profile, saveOutbox, syncWithin, referrals, clinics]
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
        photoUri: row.local_photo_uri ?? photoUrlFor(row.photo_path),
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
      const waiting = outboxRef.current.find((j): j is ScanJob => j.kind === 'scan' && j.id === r.id);
      return historyRef.current.find(h => h.id === r.id) ?? (waiting ? pendingScanRow(waiting) : null);
    }
    setSaving(true);
    try {
      // Saved on the phone first, so nothing is lost without signal, then uploaded.
      const id = newId();
      const job: ScanJob = {
        kind: 'scan',
        id,
        patientId: newId(),
        externalId: patientId.trim() || null,
        name: r.name,
        eyeLabel: r.eyeLabel,
        scannedAt: new Date().toISOString().slice(0, 10),
        probability: r.probability,
        detected: r.status.detected,
        severity: r.status.severity,
        workerName: profile?.full_name ?? 'Health worker',
        photoUri: capturedPhotoUri ? keepPhoto(capturedPhotoUri, id) : null,
        createdAt: new Date().toISOString(),
      };
      saveOutbox([...outboxRef.current, job]);
      resetDraft();
      await syncWithin();
      return historyRef.current.find(h => h.id === id) ?? pendingScanRow(job);
    } finally {
      setSaving(false);
    }
  }, [currentResult, patientId, capturedPhotoUri, profile, resetDraft, saveOutbox, syncWithin]);

  const value = useMemo<ScreeningContextValue>(
    () => ({
      authReady, profile, accountError, signIn, signOut, changePassword, checkNeedsSetup, setupFirstAccount,
      accounts, createWorker, createClinicLogin, removeAccount,
      history: shownHistory, clinics, referrals: shownReferrals, settings, loading, loadError, refreshAll, toggleNotifications, photoUrlFor,
      sync, syncNow,
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
      shownHistory, clinics, shownReferrals, settings, loading, loadError, refreshAll, toggleNotifications, photoUrlFor,
      sync, syncNow,
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
