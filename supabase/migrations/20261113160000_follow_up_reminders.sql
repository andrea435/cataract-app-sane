-- Follow-up reminders: flag referred patients who haven't reached the clinic after N days.
--
-- A referral is "due for follow-up" while its status is still `referred` and more than
-- `worker_settings.follow_up_days` days have passed since it was sent, or since the health
-- worker last followed it up (`referrals.followed_up_at`, set by "Followed up" in the app,
-- which restarts the count).

alter table public.worker_settings
  add column follow_up_days integer not null default 14 check (follow_up_days between 1 and 365);

comment on column public.worker_settings.follow_up_days is 'Days after a referral (or the last follow-up) before a patient not yet attended is flagged';

alter table public.referrals add column followed_up_at timestamptz;

comment on column public.referrals.followed_up_at is 'Last time the health worker followed up a patient who had not attended; restarts the reminder count';

-- Clinic staff may still change only a referral's status and clinic note.
create or replace function public.referrals_guard_clinic_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.my_role() = 'clinic' and (
    new.patient_id, new.scan_id, new.clinic_id, new.worker_name, new.worker_note, new.worker_id, new.created_at,
    new.share_consent_at, new.followed_up_at
  ) is distinct from (
    old.patient_id, old.scan_id, old.clinic_id, old.worker_name, old.worker_note, old.worker_id, old.created_at,
    old.share_consent_at, old.followed_up_at
  ) then
    raise exception 'Clinic staff can only change a referral''s status and clinic note';
  end if;
  return new;
end $$;
