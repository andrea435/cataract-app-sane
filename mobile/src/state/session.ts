import { File, Paths } from 'expo-file-system';

// Which side of the app this phone is signed in to. Health worker is the default; a clinic
// session is remembered on the device so clinic staff don't re-enter their code every launch.
export type Session = { role: 'worker' } | { role: 'clinic'; clinicId: string };

const WORKER: Session = { role: 'worker' };

function sessionFile(): File | null {
  try {
    return new File(Paths.document, 'session.json');
  } catch {
    return null;
  }
}

export function loadSession(): Session {
  try {
    const file = sessionFile();
    if (!file?.exists) return WORKER;
    const parsed = JSON.parse(file.textSync());
    if (parsed?.role === 'clinic' && typeof parsed.clinicId === 'string') return { role: 'clinic', clinicId: parsed.clinicId };
  } catch {
    // Unreadable session: fall back to the health worker view.
  }
  return WORKER;
}

export function saveSession(session: Session): void {
  try {
    const file = sessionFile();
    if (!file) return;
    if (session.role === 'worker') {
      if (file.exists) file.delete();
      return;
    }
    if (!file.exists) file.create();
    file.write(JSON.stringify(session));
  } catch {
    // Not persisting is acceptable: the user just signs in again next launch.
  }
}
