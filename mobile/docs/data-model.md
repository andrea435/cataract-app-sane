# Data model

The app's backend is a Supabase project (Postgres + Storage). The phone talks to it
directly with the public anon key from `mobile/.env`; there is no server of our own.

```
patients 1 ──── * scans
   1                 1
   └──── * referrals * ──── 1 clinics
                                         worker_settings (single row)
storage bucket: eye-captures   (<scan id>.jpg)
```

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
| `worker_name` | text | Health worker who did the screening |
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
| `access_code` | text | Six digits. Clinic staff enter it to open the clinic view. Random by default |
| `booked_at` | timestamptz, nullable | Legacy, from the old "Refer patient" button; no longer written |
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
| `worker_note` | text, nullable | Note for the clinic, written when referring |
| `clinic_note` | text, nullable | Written by clinic staff; shown to the health worker |
| `created_at`, `updated_at` | timestamptz | `updated_at` is set by a trigger on every update |

Triggers: `referrals_touch` keeps `updated_at` fresh; `referrals_sync_patient` copies the
status of the patient's newest referral to `patients.referral_status`. The table is in the
`supabase_realtime` publication so both sides of the app see changes live.

### `worker_settings`

A single row (`id = 1`, enforced by a check) for the one implied health worker:
`worker_name`, `worker_initials`, `worker_region`, `notifications_enabled`,
`ai_model_version`.

## Storage

Public bucket **`eye-captures`**. After a scan row is inserted, the app uploads the JPEG to
`<scan id>.jpg` and writes that path to `scans.photo_path`. Upload is best effort: if it
fails the scan is still saved without a photo. The app shows photos through their public
URL.

## How the app writes data

All reads and writes live in `src/state/ScreeningContext.tsx`.

- **On launch:** loads all scans (with the linked patient embedded via
  `select('*, patient:patients(*)')`), all clinics, all referrals (with patient, scan and
  clinic name embedded), and `worker_settings` row 1. It also subscribes to realtime
  changes on `referrals` and reloads them when anything changes.
- **Finish & save:** upserts the patient on `external_id` (so a repeated Patient ID
  reuses the same patient; a blank ID always creates a new one), inserts the scan, then
  uploads the photo.
- **Add / edit / remove clinic:** insert, update or delete on `clinics`.
- **Refer to a clinic:** saves the screening first if it is still in progress, then
  inserts a `referrals` row.
- **Referral status and clinic notes:** update `referrals.status` / `clinic_note` (from the
  clinic view, or the stepper on a result). The trigger updates `patients.referral_status`.
- **Clinic sign in:** checks the entered code against `clinics.access_code` on the phone,
  then remembers the clinic in `session.json` in the app's document folder.
- **Notifications toggle:** updates `worker_settings.notifications_enabled`.

## Access control

Row Level Security is enabled on every table, but each table has a single
`anon full access` policy (`using (true) with check (true)`). Anyone with the anon key can
read and change everything. This is acceptable for a prototype only: add Supabase Auth and
per-worker policies before storing real patient data.

The clinic access code is the same: it keeps casual users out of the wrong clinic's view,
but it is checked on the phone and the codes are readable with the anon key, so it is not a
security boundary. The step up is Supabase Auth accounts for clinic staff, with policies
that let a clinic read only `referrals` where `clinic_id` matches its own.

## Migrations

`supabase/migrations/` holds the `patients` migration
(`20261026062000_create_patients.sql`) and the clinics and referrals migration
(`20261113080000_clinics_and_referrals.sql`). The earlier tables (`scans`, `clinics`,
`worker_settings`) and the storage bucket were created directly in the Supabase project and
are not yet captured as migration files, so this document is the reference for their
structure.
