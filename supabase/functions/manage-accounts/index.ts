// Creates and removes app accounts. Public sign-up is never used: every account is made
// here with the service role, already confirmed (so no email setup is needed), and gets a
// `profiles` row saying whether it is a health worker or clinic staff.
//
// Actions (POST JSON { action, ... }):
//   status               anyone        → { needsSetup } (true while no accounts exist)
//   bootstrap            anyone, once  → first account, an admin health worker
//   create_worker        admin worker  → another health worker
//   create_clinic_user   any worker    → a login for one clinic's staff
//   delete_user          worker        → remove a clinic login; admins can also remove workers
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const fail = (error: string, status = 400) => json({ error }, status);

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Profile = { id: string; role: 'worker' | 'clinic'; clinic_id: string | null; is_admin: boolean };

async function caller(req: Request): Promise<Profile | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  if (!data.user) return null;
  const { data: profile } = await admin.from('profiles').select('id, role, clinic_id, is_admin').eq('id', data.user.id).maybeSingle();
  return (profile as Profile) ?? null;
}

async function accountCount(): Promise<number> {
  const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true });
  return count ?? 0;
}

function clean(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

async function createAccount(input: {
  email: string;
  password: string;
  full_name: string;
  role: 'worker' | 'clinic';
  clinic_id?: string | null;
  region?: string | null;
  is_admin?: boolean;
}) {
  if (!/^\S+@\S+\.\S+$/.test(input.email)) return fail('Enter a valid email address.');
  if (input.password.length < 8) return fail('The password must be at least 8 characters.');
  if (!input.full_name) return fail('Enter a name.');

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? '');
    return fail(taken ? 'An account with this email already exists.' : `Couldn't create the account: ${error?.message}`);
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .insert({
      id: data.user.id,
      role: input.role,
      clinic_id: input.role === 'clinic' ? input.clinic_id : null,
      full_name: input.full_name,
      email: input.email,
      region: input.region ?? null,
      is_admin: !!input.is_admin,
    })
    .select('*')
    .single();
  if (profileError) {
    // Don't leave a login behind that has no access.
    await admin.auth.admin.deleteUser(data.user.id);
    return fail(`Couldn't create the account: ${profileError.message}`);
  }
  return json({ profile });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail('Use POST.', 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail('Send a JSON body.');
  }
  const action = clean(body.action);
  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const full_name = clean(body.full_name);

  if (action === 'status') return json({ needsSetup: (await accountCount()) === 0 });

  if (action === 'bootstrap') {
    if ((await accountCount()) > 0) return fail('The first account has already been set up. Sign in instead.', 409);
    return createAccount({ email, password, full_name, role: 'worker', region: clean(body.region) || null, is_admin: true });
  }

  const me = await caller(req);
  if (!me || me.role !== 'worker') return fail('Only signed-in health workers can manage accounts.', 403);

  if (action === 'create_worker') {
    if (!me.is_admin) return fail('Only admin health workers can add health workers.', 403);
    return createAccount({ email, password, full_name, role: 'worker', region: clean(body.region) || null, is_admin: body.is_admin === true });
  }

  if (action === 'create_clinic_user') {
    const clinic_id = clean(body.clinic_id);
    const { data: clinic } = await admin.from('clinics').select('id').eq('id', clinic_id).maybeSingle();
    if (!clinic) return fail('That clinic no longer exists.', 404);
    return createAccount({ email, password, full_name, role: 'clinic', clinic_id });
  }

  if (action === 'delete_user') {
    const userId = clean(body.user_id);
    if (userId === me.id) return fail("You can't remove your own account.");
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (!target) return fail('That account no longer exists.', 404);
    if (target.role === 'worker' && !me.is_admin) return fail('Only admin health workers can remove health workers.', 403);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return fail(`Couldn't remove the account: ${error.message}`);
    return json({ ok: true });
  }

  return fail('Unknown action.');
});
