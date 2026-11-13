-- Clinics become manageable from the app, and referrals become their own records so a
-- clinic can see the patients sent to it and update their status from its own view.

-- 1. Clinics: health workers can add, edit and remove them.
alter table public.clinics alter column id set default gen_random_uuid()::text;
alter table public.clinics alter column distance drop not null;
alter table public.clinics alter column address drop not null;
alter table public.clinics alter column phone drop not null;

-- Six-digit code that clinic staff enter to open the clinic view.
-- Prototype only: anyone with the anon key can read it (see docs/data-model.md).
alter table public.clinics
  add column access_code text not null
    default lpad((floor(random() * 1000000))::int::text, 6, '0'),
  add column created_at timestamptz not null default now();

-- The default above is evaluated once per existing row, so each clinic gets its own code.

-- 2. Referrals: one row per patient sent to a clinic.
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  -- The screening that led to the referral (its photo and score are shown to the clinic).
  scan_id uuid references public.scans (id) on delete set null,
  -- A clinic that still has referrals can't be deleted; the app explains this.
  clinic_id text not null references public.clinics (id) on delete restrict,
  status text not null default 'referred' check (status in ('referred', 'attended', 'treated')),
  worker_name text not null,
  worker_note text,
  clinic_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index referrals_clinic_id_idx on public.referrals (clinic_id, created_at desc);
create index referrals_patient_id_idx on public.referrals (patient_id, created_at desc);

alter table public.referrals enable row level security;

-- Same access model as the other tables in this project.
create policy "anon full access" on public.referrals
  for all using (true) with check (true);

-- 3. Keep updated_at fresh and mirror the latest referral's status onto the patient, so
-- patients.referral_status (used by History) stays correct whoever changes it.
create or replace function public.referrals_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end $$;

create trigger referrals_touch
  before update on public.referrals
  for each row execute function public.referrals_set_updated_at();

create or replace function public.referrals_sync_patient()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  pid uuid := coalesce(new.patient_id, old.patient_id);
begin
  update public.patients p
  set referral_status = (
    select r.status from public.referrals r
    where r.patient_id = pid
    order by r.created_at desc
    limit 1
  )
  where p.id = pid
    -- Only overwrite when the patient still has a referral row; otherwise keep any
    -- status set by hand before referrals existed.
    and exists (select 1 from public.referrals r where r.patient_id = pid);
  return null;
end $$;

create trigger referrals_sync_patient
  after insert or update of status or delete on public.referrals
  for each row execute function public.referrals_sync_patient();

-- 4. Live updates: the clinic view and the health worker's app subscribe to changes.
alter publication supabase_realtime add table public.referrals;
