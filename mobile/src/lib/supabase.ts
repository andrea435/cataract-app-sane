import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { authStorage } from './authStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Supabase's own default key name, spelled out so the app can read the saved session itself.
const AUTH_STORAGE_KEY = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Refresh the sign-in token only while the app is in the foreground (Supabase's advice for
// React Native), so a phone left in a pocket doesn't keep waking up.
AppState.addEventListener('change', state => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/**
 * The user id of the session saved on this phone, read straight from storage. Used offline:
 * once the hour-long access token has expired, Supabase can't renew it without signal and
 * reports no session, but the saved session is still there and is renewed when signal returns.
 */
export function storedSessionUserId(): string | null {
  try {
    const raw = authStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Removes the saved session from the phone (used to log out while offline). */
export function forgetStoredSession(): void {
  authStorage.removeItem(AUTH_STORAGE_KEY);
}

export const EYE_CAPTURES_BUCKET = 'eye-captures';

// Signed photo links last this long; the app re-signs them on every refresh.
export const PHOTO_URL_TTL_SECONDS = 60 * 60;

/** Calls the `manage-accounts` Edge Function and turns its `{ error }` replies into messages. */
export async function manageAccounts<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke('manage-accounts', { body });
  if (error) {
    // Non-2xx replies carry our own `{ error }` message in the response body.
    try {
      const ctx = (error as { context?: Response }).context;
      const parsed = ctx ? await ctx.json() : null;
      if (parsed?.error) return { ok: false, error: parsed.error };
    } catch {
      // fall through
    }
    return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
  return { ok: true, data: data as T };
}
