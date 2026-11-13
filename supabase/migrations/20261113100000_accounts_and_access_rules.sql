-- Real sign-in for health workers and clinic staff, replacing open anon access.
--
-- Everyone signs in with Supabase Auth (email + password). Accounts are created by the
-- `manage-accounts` Edge Function, never by public sign-up, and each one gets a row in
-- `profiles` that says who they are:
--   * worker  – health worker; sees and manages everything (as before).
--   * clinic  – staff of one clinic; sees only referrals sent to that clinic, plus the
--               patient, screening and photo behind each one, and can change only the
--               referral's status and clinic note.
-- Anonymous requests (the public anon key alone) can no longer read or write anything.

-- 1. Profiles -------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('worker', 'clinic')),
  -- Set for clinic staff only. Removing a clinic removes its staff's access.
  clinic_id text references public.clinics (id) on delete cascade,
  full_name text not null,
  email text not null,
  region text,
  -- Admin workers can add and remove other health workers.
  is_admin boolean not null default false,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_clinic_matches_role check ((role = 'clinic') = (clinic_id is not null))
);

create index profiles_clinic_id_idx on public.profiles (clinic_id);

alter table public.profiles enable row level security;

-- Helpers used by the policies below. SECURITY DEFINER so they can read profiles
-- without tripping over profiles' own RLS.
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_clinic_id()
returns text language sql stable security definer set search_path = public as $$
  select clinic_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_worker()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'worker' from public.profiles where id = auth.uid()), false)
$$;

revoke all on function public.my_role(), public.my_clinic_id(), public.is_worker() from public, anon;
grant execute on function public.my_role(), public.my_clinic_id(), public.is_worker() to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "workers read all profiles" on public.profiles
  for select to authenticated using (public.is_worker());

-- People may edit only their own name, region and notification setting; role, clinic and
-- admin flag change only through the Edge Function (service role).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, region, notifications_enabled) on public.profiles to authenticated;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 2. Who did what ---------------------------------------------------------------------

alter table public.scans add column worker_id uuid references auth.users (id) on delete set null default auth.uid();
alter table public.referrals add column worker_id uuid references auth.users (id) on delete set null default auth.uid();

-- 3. Replace the open policies ----------------------------------------------------------

-- Health workers: full access, as before, but only when signed in. (The old open policies
-- are altered in place rather than dropped and recreated.)
alter policy "anon full access" on public.scans to authenticated using (public.is_worker()) with check (public.is_worker());
alter policy "anon full access" on public.patients to authenticated using (public.is_worker()) with check (public.is_worker());
alter policy "anon full access" on public.clinics to authenticated using (public.is_worker()) with check (public.is_worker());
alter policy "anon full access" on public.referrals to authenticated using (public.is_worker()) with check (public.is_worker());
alter policy "anon full access" on public.scans rename to "workers full access";
alter policy "anon full access" on public.patients rename to "workers full access";
alter policy "anon full access" on public.clinics rename to "workers full access";
alter policy "anon full access" on public.referrals rename to "workers full access";

-- Clinic staff: their own clinic and its referrals.
create policy "clinic staff read own clinic" on public.clinics
  for select to authenticated using (id = public.my_clinic_id());

create policy "clinic staff read own referrals" on public.referrals
  for select to authenticated using (clinic_id = public.my_clinic_id());

create policy "clinic staff update own referrals" on public.referrals
  for update to authenticated
  using (clinic_id = public.my_clinic_id())
  with check (clinic_id = public.my_clinic_id());

-- ...and the patients and screenings behind those referrals, read only.
create policy "clinic staff read referred patients" on public.patients
  for select to authenticated
  using (exists (select 1 from public.referrals r where r.patient_id = patients.id and r.clinic_id = public.my_clinic_id()));

create policy "clinic staff read referred scans" on public.scans
  for select to authenticated
  using (exists (select 1 from public.referrals r where r.scan_id = scans.id and r.clinic_id = public.my_clinic_id()));

-- Clinic staff may change only the status and their note on a referral.
create or replace function public.referrals_guard_clinic_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.my_role() = 'clinic' and (
    new.patient_id, new.scan_id, new.clinic_id, new.worker_name, new.worker_note, new.worker_id, new.created_at
  ) is distinct from (
    old.patient_id, old.scan_id, old.clinic_id, old.worker_name, old.worker_note, old.worker_id, old.created_at
  ) then
    raise exception 'Clinic staff can only change a referral''s status and clinic note';
  end if;
  return new;
end $$;

create trigger referrals_guard_clinic_update
  before update on public.referrals
  for each row execute function public.referrals_guard_clinic_update();

-- The status mirror writes to patients, which clinic staff can't update directly.
alter function public.referrals_sync_patient() security definer;

-- Shared settings (AI model version): readable by anyone signed in, editable by workers.
alter policy "anon full access" on public.worker_settings to authenticated using (true) with check (public.is_worker());
alter policy "anon full access" on public.worker_settings rename to "signed-in read, workers edit";
create policy "only workers change settings" on public.worker_settings
  as restrictive for update to authenticated using (public.is_worker());
create policy "only workers remove settings" on public.worker_settings
  as restrictive for delete to authenticated using (public.is_worker());

-- 4. The shared 6-digit clinic code is replaced by individual clinic staff logins. The
-- column is kept (no longer used by the app) but no longer required.
alter table public.clinics alter column access_code drop not null, alter column access_code drop default;

-- 5. Eye photos become private ----------------------------------------------------------

update storage.buckets set public = false where id = 'eye-captures';

-- The old open read/write policies now only apply to signed-in health workers.
alter policy "anon read eye-captures" on storage.objects to authenticated
  using (bucket_id = 'eye-captures' and public.is_worker());
alter policy "anon write eye-captures" on storage.objects to authenticated
  with check (bucket_id = 'eye-captures' and public.is_worker());
alter policy "anon read eye-captures" on storage.objects rename to "workers read eye photos";
alter policy "anon write eye-captures" on storage.objects rename to "workers upload eye photos";
-- Re-uploading a photo (upsert) also needs update.
create policy "workers replace eye photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'eye-captures' and public.is_worker())
  with check (bucket_id = 'eye-captures' and public.is_worker());

create policy "clinic staff read referred eye photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'eye-captures'
    and exists (
      select 1 from public.scans s
      join public.referrals r on r.scan_id = s.id
      where s.photo_path = storage.objects.name and r.clinic_id = public.my_clinic_id()
    )
  );
