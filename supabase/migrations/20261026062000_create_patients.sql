-- Patients get their own table so referral status is tracked per person,
-- not per screening. scans keeps patient_name / patient_id as a snapshot of
-- what was entered at scan time and links to the patient via patient_record_id.

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Optional ID typed in by the health worker (shown as "Patient ID" in the app).
  external_id text unique,
  -- NULL means the patient has not been referred.
  referral_status text check (referral_status in ('referred', 'attended', 'treated')),
  created_at timestamptz not null default now()
);

alter table public.patients enable row level security;

-- Same access model as the other tables in this project.
create policy "anon full access" on public.patients
  for all using (true) with check (true);

alter table public.scans
  add column patient_record_id uuid references public.patients (id) on delete set null;

create index scans_patient_record_id_idx on public.scans (patient_record_id);

-- Backfill: one patient per distinct patient ID, using the most recent name.
insert into public.patients (name, external_id)
select distinct on (patient_id) patient_name, patient_id
from public.scans
where patient_id is not null
order by patient_id, scanned_at desc, created_at desc;

update public.scans s
set patient_record_id = p.id
from public.patients p
where s.patient_id = p.external_id;

-- Scans without a patient ID can't be matched safely by name, so each gets its own patient.
do $$
declare
  r record;
  new_id uuid;
begin
  for r in select id, patient_name from public.scans where patient_record_id is null loop
    insert into public.patients (name) values (r.patient_name) returning id into new_id;
    update public.scans set patient_record_id = new_id where id = r.id;
  end loop;
end $$;
