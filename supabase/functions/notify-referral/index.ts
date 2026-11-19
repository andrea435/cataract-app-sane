// Sends lock-screen push alerts about a referral, through Firebase Cloud Messaging.
//
// The app calls this (POST JSON { referral_id, event }) right after:
//   event "created"  a health worker sent a referral  → alerts that clinic's staff
//   event "updated"  clinic staff changed its status or note → alerts the health worker
//                    who sent it
// Only people allowed to see the referral can trigger an alert about it, and only people
// with notifications switched on (profiles.notifications_enabled) receive one.
//
// Needs the secret FCM_SERVICE_ACCOUNT: the JSON key of a Firebase service account
// (Firebase console → Project settings → Service accounts → Generate new private key):
//   supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"
// Without it the function does nothing (the app still shows alerts while it is open).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function serviceAccount(): ServiceAccount | null {
  try {
    const raw = Deno.env.get('FCM_SERVICE_ACCOUNT');
    return raw ? (JSON.parse(raw) as ServiceAccount) : null;
  } catch {
    return null;
  }
}

const b64url = (data: ArrayBuffer | string) =>
  btoa(typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

let cachedToken: { value: string; expires: number } | null = null;

/** OAuth access token for FCM, from a JWT signed with the service account key. */
async function fcmAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(signature)}` }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`FCM auth failed: ${JSON.stringify(body)}`);
  cachedToken = { value: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cachedToken.value;
}

async function send(sa: ServiceAccount, token: string, title: string, body: string, referralId: string): Promise<'ok' | 'gone' | 'error'> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await fcmAccessToken(sa)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { referralId },
        android: { priority: 'high', notification: { channel_id: 'referrals' } },
      },
    }),
  });
  if (res.ok) return 'ok';
  // UNREGISTERED: the app was uninstalled or the token replaced, so forget it.
  return res.status === 404 ? 'gone' : 'error';
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData } = await admin.auth.getUser(jwt);
  if (!userData.user) return json({ error: 'Sign in first.' }, 401);
  const { data: me } = await admin.from('profiles').select('id, role, clinic_id').eq('id', userData.user.id).maybeSingle();
  if (!me) return json({ error: 'No access.' }, 403);

  const { referral_id, event } = await req.json().catch(() => ({}));
  if (typeof referral_id !== 'string' || !['created', 'updated'].includes(event)) return json({ error: 'Bad request.' }, 400);

  const { data: r } = await admin
    .from('referrals')
    .select('id, status, clinic_id, clinic_note, worker_id, worker_name, patient:patients(name), clinic:clinics(name)')
    .eq('id', referral_id)
    .maybeSingle();
  if (!r) return json({ error: 'Not found.' }, 404);
  // Same rule as the database: workers see every referral, clinic staff only their own.
  if (me.role === 'clinic' && me.clinic_id !== r.clinic_id) return json({ error: 'No access.' }, 403);

  const sa = serviceAccount();
  if (!sa) return json({ sent: 0, reason: 'Push is not set up (FCM_SERVICE_ACCOUNT missing).' });

  const patient = (r.patient as { name?: string } | null)?.name ?? 'A patient';
  const clinic = (r.clinic as { name?: string } | null)?.name ?? 'the clinic';

  let recipients: string[] = [];
  let title = '';
  let body = '';
  if (event === 'created') {
    const { data } = await admin.from('profiles').select('id').eq('clinic_id', r.clinic_id).eq('notifications_enabled', true);
    recipients = (data ?? []).map(p => p.id);
    title = 'New referral';
    body = `${patient} was referred to you by ${r.worker_name}.`;
  } else {
    if (!r.worker_id || r.worker_id === me.id) return json({ sent: 0 });
    const { data } = await admin.from('profiles').select('id').eq('id', r.worker_id).eq('notifications_enabled', true);
    recipients = (data ?? []).map(p => p.id);
    if (r.status === 'referred') {
      title = `Note from ${clinic}`;
      body = `${patient}: ${r.clinic_note ?? ''}`;
    } else {
      title = `${patient} ${r.status === 'treated' ? 'was treated' : 'attended'}`;
      body = `${clinic} marked them as ${r.status}.`;
    }
  }
  recipients = recipients.filter(id => id !== me.id);
  if (recipients.length === 0) return json({ sent: 0 });

  const { data: tokens } = await admin.from('push_tokens').select('token').in('user_id', recipients);
  let sent = 0;
  for (const { token } of tokens ?? []) {
    const result = await send(sa, token, title, body, r.id).catch(() => 'error' as const);
    if (result === 'ok') sent++;
    if (result === 'gone') await admin.from('push_tokens').delete().eq('token', token);
  }
  return json({ sent });
});
