-- Who can open eye photos. Run in the Supabase dashboard (SQL editor); policies on
-- storage.objects can only be changed by the storage owner, not by migrations run as
-- `postgres`. Until this runs, the old open "anon" photo policies still apply.
--
-- Health workers: read, upload and replace every photo.
-- Clinic staff: read only photos of screenings referred to their clinic.
-- Anyone else (anon key only): nothing.

drop policy if exists "anon read eye-captures" on storage.objects;
drop policy if exists "anon write eye-captures" on storage.objects;

create policy "workers read eye photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'eye-captures' and public.is_worker());

create policy "workers upload eye photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'eye-captures' and public.is_worker());

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
