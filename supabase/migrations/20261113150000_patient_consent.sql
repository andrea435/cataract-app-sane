-- Patient consent (POPIA-style), recorded with every screening and every referral.
--
-- Before an eye photo is taken the health worker reads the privacy notice to the patient
-- (or their parent or guardian) and records their answer in the app:
--   * consent to the screening: the photo and result being taken and stored (required to
--     continue), and
--   * consent to share the result with a clinic for referral (optional; asked again at
--     referral time if it wasn't given).
-- All columns are nullable: screenings saved before this change have no consent recorded.

alter table public.scans
  add column consent_at timestamptz,
  add column consent_version text,
  add column consent_by text check (consent_by in ('patient', 'guardian')),
  add column consent_guardian_name text,
  add column consent_share boolean;

comment on column public.scans.consent_at is 'When the patient (or guardian) agreed to the screening; null for screenings saved before consent was recorded';
comment on column public.scans.consent_version is 'Version of the privacy notice that was read to them, e.g. 2026-11-v1';
comment on column public.scans.consent_by is 'Who gave consent: patient or guardian';
comment on column public.scans.consent_share is 'Agreed to share the result with a clinic for referral';

-- When the referral was sent, the patient had agreed to share their result with that clinic.
alter table public.referrals add column share_consent_at timestamptz;

comment on column public.referrals.share_consent_at is 'When the patient agreed to share their result with the clinic (at screening or at referral)';

-- Clinic staff may still change only a referral's status and clinic note (now also not
-- the consent time).
create or replace function public.referrals_guard_clinic_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.my_role() = 'clinic' and (
    new.patient_id, new.scan_id, new.clinic_id, new.worker_name, new.worker_note, new.worker_id, new.created_at, new.share_consent_at
  ) is distinct from (
    old.patient_id, old.scan_id, old.clinic_id, old.worker_name, old.worker_note, old.worker_id, old.created_at, old.share_consent_at
  ) then
    raise exception 'Clinic staff can only change a referral''s status and clinic note';
  end if;
  return new;
end $$;
