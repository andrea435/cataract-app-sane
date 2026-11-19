# Turning on lock-screen push alerts

Referral alerts work in two ways:

| | Works without setup | Needs Firebase |
| --- | --- | --- |
| Alert while the app is open or was used recently | Yes | |
| Alert on the lock screen when the app is closed | | Yes |

Clinic staff get **New referral**. Health workers get **attended**, **treated** or **Note
from the clinic** for referrals they sent. Everyone can switch alerts off with
**Notifications** on their Profile.

Android only delivers notifications to a closed app through Google's Firebase Cloud
Messaging (FCM). It's free. Setup takes about 15 minutes and is done once.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. **Create a project**, for example "Cataract Screening". Google Analytics isn't needed.
3. In the project, click the **Android** icon to add an Android app:
   - **Android package name:** `com.andrea435.cataractscreening` (exactly this)
   - Nickname: anything. Skip the SHA-1.
4. Click **Register app**, then **Download google-services.json**. Skip the remaining
   steps of the wizard.

## 2. Put the file into the app build

Pick one:

- **GitHub secret (recommended):** in the repository go to **Settings → Secrets and
  variables → Actions → New repository secret**. Name it `GOOGLE_SERVICES_JSON` and paste
  the whole contents of `google-services.json` as the value.
- **Or commit it** as `mobile/google-services.json`. It only identifies the Firebase
  project to the app; it's not a password.

The next APK build includes it (`mobile/app.config.js` picks it up). Install that APK on the
phones.

## 3. Let the server send pushes

1. In Firebase: **Project settings (gear) → Service accounts → Generate new private key**.
   This downloads a JSON file. **Keep it secret**: it lets anyone send notifications as
   your app.
2. Store it as a Supabase secret and deploy the function (from the repository folder, with
   the Supabase CLI signed in):

   ```
   supabase secrets set --project-ref xyfdtycvotzlhkcicnnx FCM_SERVICE_ACCOUNT="$(cat path/to/service-account.json)"
   supabase functions deploy notify-referral --project-ref xyfdtycvotzlhkcicnnx
   ```

   Or in the Supabase dashboard: **Edge Functions → Secrets → Add new secret**, with name
   `FCM_SERVICE_ACCOUNT` and the file's contents as the value.

## How it works

- After sign-in, a phone that allows notifications saves its FCM token to the
  `push_tokens` table (only its own row). Logging out removes it.
- When a referral is sent (including one that was waiting offline), the app calls the
  `notify-referral` Edge Function, which pushes to that clinic's staff. When clinic staff
  change a referral's status or note, it pushes to the health worker who sent it. Only
  people allowed to see the referral can trigger an alert, and people with Notifications
  switched off get none.
- While the app is open it shows its own alert instead, so nothing appears twice.
- If `FCM_SERVICE_ACCOUNT` isn't set, the function does nothing. If the build has no
  `google-services.json`, phones don't register. Either way the in-app alerts keep
  working.
- iPhone builds aren't covered yet. They would need an Apple developer account and an
  APNs key added to the same Firebase project.
