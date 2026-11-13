# Cataract Screening: user guide

This guide is for community health workers who use the app to screen patients, and for
anyone training them.

> **Important.** The app gives a screening estimate, not a diagnosis. Use it to decide who
> should be referred. Every patient flagged for cataract must be seen by an ophthalmologist
> or trained eye care professional. In this version of the app the probability score is
> simulated, so it must not be used to make decisions about real patients yet.

## 1. Installing the app

You need an Android phone with a working rear camera and an internet connection.

1. Get the file `app-release.apk` from your project lead (by USB cable, Google Drive,
   WhatsApp, email and so on).
2. Open the file on the phone. The first time, Android asks you to allow installs from
   that source (for example "Files" or "Chrome"). Allow it, go back, and tap **Install**.
3. Open **Cataract Screening** from your app list.
4. The first time you take a photo, the app asks for permission to use the camera. Tap
   **Allow**. Without it you cannot capture eye images.

To update the app, install the new APK over the old one. Your screening history is kept,
because it is stored online, not on the phone.

## 2. First launch

Three welcome screens explain what the app does. Tap **Next** to read them, or **Skip** to
go straight to the app. Clinic staff tap **Clinic staff? Open clinic view** at the bottom
instead (see [section 6](#6-for-clinic-staff-the-clinic-view)).

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

## 5. Clinics and referrals

### Adding clinics

Open the **Clinics** tab and tap **Add**. Enter the clinic's name, and if you like its
address, phone number and distance. The app gives the clinic a **6-digit access code**.
Share this code with the clinic: their staff need it to open their clinic view. Tap
**New code** to make a different one.

Tap a clinic to edit it, see its code, or remove it. A clinic that already has referrals
can't be removed.

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
2. On the welcome screen, tap **Clinic staff? Open clinic view**. (A health worker can also
   find **Open clinic view** on the Profile tab.)
3. Choose your clinic, enter the 6-digit access code the health worker gave you, and tap
   **Open clinic view**. The phone stays signed in to your clinic until you tap
   **Sign out**.

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
turned on or off, and **About the AI model** shows the model version. Language, Sync data,
Help & support and Log out are not active yet. **Open clinic view** switches this phone to
the clinic view.

## 9. Troubleshooting

| Problem | What to do |
| --- | --- |
| "Camera access was denied" | Open phone **Settings → Apps → Cataract Screening → Permissions** and allow Camera, then reopen the app. |
| History or clinics are empty, or a red "Couldn't reach the server" banner shows | Check the phone's internet connection, then pull down on the screen or tap **Retry**. |
| "That code doesn't match this clinic" | Check you picked the right clinic. Ask the health worker for the code; they can see it by tapping the clinic on their Clinics tab. |
| A screening didn't appear in History | It is only saved after **Finish & save to history**. Check the internet connection and screen again. |
| Android won't install the APK | Allow installs from unknown sources for the app you opened the file with. If an older copy was signed differently, uninstall it first. |
