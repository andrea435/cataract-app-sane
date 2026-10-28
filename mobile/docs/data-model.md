# Data model

The app's backend is a Supabase project (Postgres + Storage). The phone talks to it
directly with the public anon key from `mobile/.env`; there is no server of our own.

```
patients 1 ──── * scans * ──── 0..1 clinics
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
| `referral_status` | text, nullable | `referred`, `attended` or `treated`; `NULL` = not referred |
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

Referral clinics shown on the Clinics tab.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text, PK | |
| `name`, `address`, `phone` | text | |
| `distance` | text | Display string such as `2.4 km`; static, not computed from location |
| `booked_at` | timestamptz, nullable | Set when "Refer patient" is tapped |

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
  `select('*, patient:patients(*)')`), all clinics, and `worker_settings` row 1.
- **Finish & save:** upserts the patient on `external_id` (so a repeated Patient ID
  reuses the same patient; a blank ID always creates a new one), inserts the scan, then
  uploads the photo.
- **Referral status:** updates `patients.referral_status`.
- **Refer patient (Clinics tab):** sets `clinics.booked_at`.
- **Notifications toggle:** updates `worker_settings.notifications_enabled`.

## Access control

Row Level Security is enabled on every table, but each table has a single
`anon full access` policy (`using (true) with check (true)`). Anyone with the anon key can
read and change everything. This is acceptable for a prototype only: add Supabase Auth and
per-worker policies before storing real patient data.

## Migrations

`supabase/migrations/` holds the `patients` migration
(`20261026062000_create_patients.sql`). The earlier tables (`scans`, `clinics`,
`worker_settings`) and the storage bucket were created directly in the Supabase project and
are not yet captured as migration files, so this document is the reference for their
structure.
