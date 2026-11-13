import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

// Where Supabase keeps the signed-in session on the phone, so people stay signed in between
// launches. One small file per key inside the app's private document folder.
function fileFor(key: string): File {
  const dir = new Directory(Paths.document, 'auth');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return new File(dir, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
}

const fileStorage = {
  getItem(key: string): string | null {
    try {
      const f = fileFor(key);
      return f.exists ? f.textSync() : null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      const f = fileFor(key);
      if (!f.exists) f.create();
      f.write(value);
    } catch {
      // If the session can't be stored the person simply signs in again next launch.
    }
  },
  removeItem(key: string): void {
    try {
      const f = fileFor(key);
      if (f.exists) f.delete();
    } catch {
      // ignore
    }
  },
};

// Web previews (expo start --web) have no app document folder; use the browser's storage.
const webStorage = {
  getItem: (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  removeItem: (key: string) => globalThis.localStorage?.removeItem(key),
};

export const authStorage = Platform.OS === 'web' ? webStorage : fileStorage;
