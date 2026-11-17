import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';

// Small JSON store in the app's private document folder, used for offline mode: the last data
// loaded from the server (so the app opens without signal) and the screenings and referrals
// still waiting to upload. Web previews use the browser's localStorage instead.

const isWeb = Platform.OS === 'web';

function dir(name: string): Directory {
  const d = new Directory(Paths.document, name);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

function fileFor(key: string): File {
  return new File(dir('offline'), `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = isWeb ? globalThis.localStorage?.getItem(key) ?? null : (() => {
      const f = fileFor(key);
      return f.exists ? f.textSync() : null;
    })();
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    const raw = JSON.stringify(value);
    if (isWeb) {
      globalThis.localStorage?.setItem(key, raw);
      return;
    }
    const f = fileFor(key);
    if (!f.exists) f.create();
    f.write(raw);
  } catch {
    // Out of space or similar: the app keeps working from memory.
  }
}

/**
 * Copies a captured photo out of the camera's temporary cache into the app's own folder, so
 * it survives until it has been uploaded. Returns the new location (or the original one when
 * copying isn't possible, e.g. on web).
 */
export function keepPhoto(uri: string, name: string): string {
  if (isWeb) return uri;
  try {
    const dest = new File(dir('outbox-photos'), `${name}.jpg`);
    if (dest.exists) dest.delete();
    new File(uri).copySync(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Deletes a photo kept by `keepPhoto` once it is safely uploaded. */
export function dropPhoto(uri: string | null | undefined): void {
  if (isWeb || !uri || !uri.includes('outbox-photos')) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}

/** Random v4 UUID, so records made offline already have their final id. */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
