# Cataract Screening: user guide

This guide is for community health workers who use the app to screen patients, and for
anyone training them.

> **Important.** The app gives a screening estimate, not a diagnosis. Use it to decide who
> should be referred. Every patient flagged for cataract must be seen by an ophthalmologist
> or trained eye care professional. In this version of the app the probability score is
> simulated, so it must not be used to make decisions about real patients yet.

## 1. Installing the app

You need an Android phone with a working rear camera. You need an internet connection to
install the app and sign in the first time; after that you can screen without signal (see
[Working without signal](#working-without-signal)).

1. Get the file `app-release.apk` from your project lead (by USB cable, Google Drive,
   WhatsApp, email and so on).
2. Open the file on the phone. The first time, Android asks you to allow installs from
   that source (for example "Files" or "Chrome"). Allow it, go back, and tap **Install**.
3. Open **Cataract Screening** from your app list.
4. The first time you take a photo, the app asks for permission to use the camera. Tap
   **Allow**. Without it you cannot capture eye images.

To update the app, install the new APK over the old one. Your screening history is kept,
because it is stored online. Upload anything waiting on the phone (Profile → **Sync data**)
before updating, just in case.

## 2. First launch

Three welcome screens explain what the app does. Tap **Next** to read them, or **Skip**.
Then **sign in** with the email and password a health worker on your team gave you. The
app keeps you signed in until you log out.

Health workers and clinic staff use the same app; what you see depends on your account.
Clinic staff, see [section 6](#6-for-clinic-staff-the-clinic-view).

**Setting up the app for the first time.** When no accounts exist yet, the sign-in screen
shows **Create first account**. The person setting up the programme uses it once to create
their own admin health worker account, then adds everyone else from inside the app.

## 3. The main screen

The app has four tabs at the bottom.

| Tab | What it shows |
| --- | --- |
| **Scan** | Your screenings today, how many were flagged for referral, the **Start new screening** button, and your three most recent screenings |
| **History** | Every screening saved, newest first, with result, confidence and referral status |
| **Clinics** | The clinics you refer to (add and edit them here) and every referral you have sent, with its status |
| **Profile** | Your name and region, your total, flagged and this-week counts, and settings |

## 4. Doing a screening

### Step 1: Patient details

Tap **Start new screening** on the Scan tab.

- **Patient name**: the patient's full name.
- **Patient ID (optional)**: an ID from a clinic card, register or national ID. If you
  enter the same ID on a later visit, the app links the new screening to the same patient,
  so their referral status carries over. Without an ID, every screening creates a new
  patient record.
- **Eye being screened**: choose **Left eye** or **Right eye**. Screen one eye at a time.
  To screen both eyes, do two screenings.

Tap **Continue to capture**.

### Step 2: Capture the eye image

The camera opens with a circle on screen and the eye you chose shown at the top. Align the
eye within the circle.

Tips for a good image:

- Work in even light. Avoid direct sunlight on the eye and strong reflections.
- Ask the patient to look straight ahead and keep the eye wide open.
- Hold the phone steady, close to the eye, with the eye filling the guide.
- If the picture comes out blurry or dark, cancel and take it again.

Tap the shutter button. Tap **Cancel** to go back to the main screen without saving.

### Step 3: Analysis

The app shows "Analyzing image" for a couple of seconds.

### Step 4: Read and accept the disclaimer

Read the notice, tick **I understand this is a screening aid, not a diagnosis**, and tap
**View results**.

### Step 5: The result

The result screen shows:

- The **probability** that a cataract is present, as a percentage in a ring.
- The **result**:

  | Probability | Result | Estimated severity |
  | --- | --- | --- |
  | Below 50% | No cataract detected (green) | none |
  | 50 to 64% | Cataract detected (red) | Mild |
  | 65 to 79% | Cataract detected (red) | Moderate |
  | 80% and above | Cataract detected (red) | Severe |

- The eye photo you captured.

Tap **View recommended steps**.

### Step 6: Recommended steps and saving

The app lists what to do next.

- **Cataract detected:** refer the patient to an ophthalmologist within 2 weeks, record the
  finding, advise the patient to protect the eye, and schedule a follow-up after the
  referral visit.
- **No cataract detected:** no referral needed now, advise routine eye protection, and
  schedule a routine screening in 12 months.

- **Cataract detected:** tap **Refer to a clinic** to save the screening and send the
  patient to a clinic in one go (see below), or **Save without referring**.
- **No cataract detected:** tap **Finish & save to history**.

The screening and photo are saved and appear in History.

### Working without signal

You can do everything above without signal. Each screening is saved on the phone first and
uploads by itself as soon as there is a connection, so nothing is lost in an area with no
network.

- While offline, a yellow banner says **No signal**. Screenings and referrals made then show
  a **Waiting to upload** (or **Waiting to send**) tag.
- When signal returns the app uploads them in the order you made them, by itself. It keeps
  trying every 30 seconds and whenever you open the app. Tap **Sync now** on the banner, or
  **Sync data** on the Profile tab, to try straight away.
- A referral made offline reaches the clinic only once it has uploaded. If the patient
  needs to be seen urgently, phone the clinic as well.
- The app opens without signal and shows the history, clinics and referrals from the last
  time it was online. Updates from clinics appear once you are back online.
- You need signal to sign in. If you log out with items still waiting, they stay on the
  phone and upload the next time you sign in on it. Don't uninstall the app while items are
  waiting: that deletes them.
- If the server refuses an item (shown as **Couldn't upload**), it stays on the phone; ask
  your admin to check it.

## 5. Clinics and referrals

### Adding clinics

Open the **Clinics** tab and tap **Add**. Enter the clinic's name, and if you like its
address, phone number and distance, then tap **Add clinic**.

### Giving clinic staff a login

On the clinic's page (tap the clinic in the Clinics tab), under **Clinic logins**, tap
**Add**. Enter the staff member's name and email, keep or change the suggested temporary
password, and tap **Create login**. The next screen shows the email and password: give them
to the staff member in person or by message. No email is sent, and the password isn't shown
again. If it's lost, tap **Remove** next to the login and create a new one.

A clinic card shows "No logins yet" until its staff have a login.

Tap a clinic to edit it, manage its logins, or remove it. A clinic that already has
referrals can't be removed.

### Referring a patient

1. On the recommended steps for a flagged patient, tap **Refer to a clinic**. For a
   screening that is already saved, open it from History and tap **Refer to a clinic**.
2. Choose the clinic. You can add a new one from here with **Add clinic**.
3. Optionally write a note for the clinic, for example how long the patient has had
   symptoms or whether they need help with transport.
4. Tap **Save & send referral** (or **Send referral**). The clinic sees the patient in its
   clinic view straight away.

### Following up

Open the patient's screening from History, or the **Referrals sent** list on the Clinics
tab. The referral card shows the clinic and a **Referred → Attended → Treated** tracker.
When the clinic updates the patient, the tracker moves on its own, and any note from the
clinic appears underneath. If the clinic isn't using the app, you can tap a step yourself
to record it.

The status also shows under the patient's name in History. It belongs to the patient, so
every screening of that patient shows the same status.

## 6. For clinic staff: the clinic view

1. Install the app (see [section 1](#1-installing-the-app)).
2. Sign in with the email and password the health worker gave you. The app opens straight
   onto your clinic's view, and stays signed in until you tap **Sign out**.

You only ever see patients referred to your own clinic. The first time you sign in, tap
**Change password** at the bottom of the screen and choose your own password.

The clinic view shows how many patients are **Waiting**, **Attended** and **Treated**, and
lists them. New referrals appear automatically; pull down to refresh. Tap a patient to see
their screening result, eye photo, patient ID, who referred them and the health worker's
note. Then:

- Tap **Mark as attended** when the patient arrives, and **Mark as treated** after
  treatment. You can also tap a step on the tracker to correct it.
- Write in **Clinic notes** and tap **Save note**, for example the confirmed diagnosis or
  a surgery date. The health worker sees the note.

## 7. Reviewing past screenings

Open the **History** tab and tap any screening to see its full result again, including the
photo. Tap **Back to history** to return. Past screenings cannot be edited or deleted from
the app.

## 8. Profile and settings

The Profile tab shows your name, region and screening totals. **Notifications** can be
turned on or off, and **About the AI model** shows the model version. **Change password**
lets you replace the temporary password you were given with your own; do this the first
time you sign in. **Sync data** shows how many screenings and referrals are waiting on this phone ("Up to
date" when none are); tap it to upload them now. **Log out** signs you out of this phone.
Language and Help & support are not active yet.

**Health workers** lists everyone on your team. Admins (shown with an **Admin** tag) can
tap **Add** to create a login for a new health worker, in the same way as a clinic login,
and **Remove** someone who has left. Their past screenings are kept.

## 9. Troubleshooting

| Problem | What to do |
| --- | --- |
| "Camera access was denied" | Open phone **Settings → Apps → Cataract Screening → Permissions** and allow Camera, then reopen the app. |
| A yellow "No signal" banner shows | Keep working: screenings are saved on the phone and upload by themselves when there is signal. Tap **Retry** to check again. |
| Items stay "Waiting to upload" although there is signal | Tap **Sync now**. If they still don't go, sign out and in again (you need signal), or ask your admin. |
| "Wrong email or password" | Check the email and password exactly as given (passwords are case sensitive). If it's lost, ask a health worker to remove your login and create a new one. |
| "This account no longer has access" | Your login was removed, or your clinic was removed. Ask a health worker for a new login. |
| A screening didn't appear in History | It is only saved after **Finish & save to history** (or **Save without referring** / **Save & send referral**). |
| Android won't install the APK | Allow installs from unknown sources for the app you opened the file with. If an older copy was signed differently, uninstall it first. |
