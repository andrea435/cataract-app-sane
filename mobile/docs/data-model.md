# Data model

The app's backend is a Supabase project (Postgres, Auth, Storage and one Edge Function).
The phone talks to it directly with the public anon key from `mobile/.env` plus the signed-in
person's session; there is no server of our own. Every table and the photo bucket require a
signed-in account (see [Access control](#access-control)).

```
auth.users 1 ── 1 profiles (worker | clinic) * ──── 0..1 clinics
patients 1 ──── * scans
   1                 1
   └──── * referrals * ──── 1 clinics
                                         worker_settings (single row)
storage bucket: eye-captures (private)   (<scan id>.jpg)
edge function:  manage-accounts          (creates / removes logins)
```

### `profiles`

One row per account, created only by the `manage-accounts` Edge Function.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, PK, FK → `auth.users.id` | `on delete cascade` |
| `role` | text | `worker` (health worker) or `clinic` (clinic staff) |
| `clinic_id` | text, FK → `clinics.id`, nullable | Set for clinic staff only (checked); `on delete cascade` |
| `full_name`, `email` | text | Shown in lists; `full_name` is stamped on screenings and referrals |
| `region` | text, nullable | Health workers |
| `is_admin` | boolean | Admin workers can add and remove other workers |
| `notifications_enabled` | boolean | The Profile toggle |
| `created_at` | timestamptz | |

People can update only their own `full_name`, `region` and `notifications_enabled`
(column grants); role, clinic and admin flag change only through the Edge Function.

## Tables

### `patients`

One row per person screened. Holds the referral status, so it is tracked per patient,
not per screening.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, PK | `gen_random_uuid()` |
| `name` | text | Most recent name entered for this patient |
| `external_id` | text, unique, nullable | The "Patient ID" typed by the health worker |
| `referral_status` | text, nullable | `referred`, `attended` or `treated`; `NULL` = not referred. Kept in step with the patient's latest row in `referrals` by a trigger |
| `created_at` | timestamptz | |

### `scans`

One row per screening of one eye.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, PK | Also the photo's file name in storage |
| `patient_record_id` | uuid, FK → `patients.id`, nullable | `on delete set null` |
| `patient_name` | text | Snapshot of the name entered at scan time |
| `patient_id` | text, nullable | Snapshot of the Patient ID entered at scan time |
| `eye_label` | text | `Left eye` or `Right eye` |
| `scanned_at` | date | Defaults to today |
| `probability` | smallint | 0 to 100 |
| `detected` | boolean | `probability >= 50` |
| `severity` | text, nullable | `Mild` (50–64), `Moderate` (65–79), `Severe` (80+) |
| `photo_path` | text, nullable | Object path in the `eye-captures` bucket |
| `worker_name` | text | Health worker who did the screening (their profile name) |
| `worker_id` | uuid, FK → `auth.users.id`, nullable | Defaults to the signed-in user |
| `clinic_id` | text, FK → `clinics.id`, nullable | Present in the schema; not set by the app yet |
| `created_at` | timestamptz | |

`detected` and `severity` are computed in the app (`statusFields` in
`src/data/types.ts`) and stored so they don't change if the thresholds do.

### `clinics`

Referral clinics. Health workers add, edit and remove them on the Clinics tab.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text, PK | Defaults to a random UUID for clinics added in the app |
| `name` | text | |
| `address`, `phone` | text, nullable | |
| `distance` | text, nullable | Display string such as `2.4 km`, typed by the worker; not computed from location |
| `booked_at` | timestamptz, nullable | Legacy, from the old "Refer patient" button; no longer written |
| `access_code` | text, nullable | Legacy, from the short-lived 6-digit clinic code; no longer used |
| `created_at` | timestamptz | |

A clinic that still has referrals can't be deleted (`on delete restrict`); the app says so.

### `referrals`

One row per patient sent to a clinic. The clinic view lists the rows for its clinic.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid, PK | |
| `patient_id` | uuid, FK → `patients.id` | `on delete cascade` |
| `scan_id` | uuid, FK → `scans.id`, nullable | The screening behind the referral; the clinic sees its photo and score |
| `clinic_id` | text, FK → `clinics.id` | `on delete restrict` |
| `status` | text | `referred` (default), `attended` or `treated` |
| `worker_name` | text | Health worker who sent it |
| `worker_id` | uuid, FK → `auth.users.id`, nullable | Defaults to the signed-in user |
| `worker_note` | text, nullable | Note for the clinic, written when referring |
| `clinic_note` | text, nullable | Written by clinic staff; shown to the health worker |
| `created_at`, `updated_at` | timestamptz | `updated_at` is set by a trigger on every update |

Triggers: `referrals_touch` keeps `updated_at` fresh; `referrals_sync_patient` (security
definer) copies the status of the patient's newest referral to `patients.referral_status`;
`referrals_guard_clinic_update` stops clinic staff changing anything but `status` and
`clinic_note`. The table is in the
`supabase_realtime` publication so both sides of the app see changes live.

### `worker_settings`

A single row (`id = 1`, enforced by a check). The app now reads only `ai_model_version`
from it; the worker name, region and notification setting moved to `profiles`.

## Storage

Private bucket **`eye-captures`**. After a scan row is inserted, the app uploads the JPEG
to `<scan id>.jpg` and writes that path to `scans.photo_path`. Upload is best effort: if it
fails the scan is still saved without a photo. The app shows photos through signed links
(`createSignedUrls`, valid one hour, re-signed on every refresh). Health workers can read and
write every photo; clinic staff can read only photos of screenings referred to their clinic.

## How the app writes data

All reads and writes live in `src/state/ScreeningContext.tsx`.

- **On launch:** restores the saved session (stored in the app's private document folder,
  `src/lib/authStorage.ts`) and loads the signed-in person's `profiles` row. A health worker
  then gets all scans (with the linked patient embedded via
  `select('*, patient:patients(*)')`), all clinics, all referrals (with patient, scan and
  clinic name embedded), all profiles and `worker_settings` row 1; clinic staff get their
  clinic and its referrals. Both subscribe to realtime changes on `referrals`, which
  Supabase filters through the same access rules.
- **Finish & save:** the screening goes into the phone's outbox first (offline mode), then
  is uploaded: upserts the patient on `external_id` (so a repeated Patient ID reuses the
  same patient; a blank ID creates a new one, with an id made on the phone), inserts the
  scan with an id made on the phone, then uploads the photo. Because the ids come from the
  phone, a retry after a lost reply hits a unique violation instead of a duplicate, and the
  app treats that as done.
- **Add / edit / remove clinic:** insert, update or delete on `clinics`.
- **Refer to a clinic:** saves the screening first if it is still in progress, then
  inserts a `referrals` row (also through the outbox, with an id made on the phone, after
  its screening).
- **Referral status and clinic notes:** update `referrals.status` / `clinic_note` (from the
  clinic view, or the stepper on a result). The trigger updates `patients.referral_status`.
- **Accounts:** `supabase.functions.invoke('manage-accounts', …)` with `bootstrap`,
  `create_worker`, `create_clinic_user` or `delete_user`.
- **Notifications toggle:** updates the person's own `profiles.notifications_enabled`.

## Access control

Everyone signs in with Supabase Auth (email and password). Requests with only the anon key
see nothing. Row Level Security policies (in
`20261113100000_accounts_and_access_rules.sql`) use three helpers that read the caller's
profile: `is_worker()`, `my_role()` and `my_clinic_id()`.

| | Health worker | Clinic staff |
| --- | --- | --- |
| `scans` | all | read, only screenings referred to their clinic |
| `patients` | all | read, only patients referred to their clinic |
| `clinics` | all | read, own clinic |
| `referrals` | all | read and update (status, clinic note) own clinic's |
| `profiles` | read all; update own name, region, notifications | read and update own |
| `worker_settings` | read, update | read |
| `eye-captures` photos | all | read, only referred screenings |

### Accounts and the `manage-accounts` Edge Function

Accounts are never created by public sign-up (an account without a `profiles` row can see
nothing anyway). The Edge Function `supabase/functions/manage-accounts` uses the service
role to create users that are already confirmed, so no email setup is needed, and writes
their profile:

| Action | Who may call it | Does |
| --- | --- | --- |
| `status` | anyone | `{ needsSetup }`: true while no profiles exist |
| `bootstrap` | anyone, only while no profiles exist | first account, an admin health worker |
| `create_worker` | admin health workers | another health worker (optionally admin) |
| `create_clinic_user` | health workers | a login tied to one clinic |
| `delete_user` | health workers (admins for workers) | removes the login; their past work stays |

Passwords are set by the health worker who creates the login and passed on in person;
people then change their own with **Change password** (`supabase.auth.updateUser`). There is
no forgotten-password reset yet: remove the login and create a new one.
Deploy changes with `supabase functions deploy manage-accounts`.

## Migrations

`supabase/migrations/` holds the `patients` migration
(`20261026062000_create_patients.sql`), the clinics and referrals migration
(`20261113080000_clinics_and_referrals.sql`) and the accounts and access rules migration
(`20261113100000_accounts_and_access_rules.sql`). The photo policies are in
`20261113100500_eye_photo_policies.sql`, which must be run from the Supabase dashboard's
SQL editor because only the storage owner can change policies on `storage.objects`. The earlier tables (`scans`, `clinics`,
`worker_settings`) and the storage bucket were created directly in the Supabase project and
are not yet captured as migration files, so this document is the reference for their
structure.
