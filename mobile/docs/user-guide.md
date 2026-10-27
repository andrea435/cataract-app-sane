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
go straight to the app.

## 3. The main screen

The app has four tabs at the bottom.

| Tab | What it shows |
| --- | --- |
| **Scan** | Your screenings today, how many were flagged for referral, the **Start new screening** button, and your three most recent screenings |
| **History** | Every screening saved, newest first, with result, confidence and referral status |
| **Clinics** | Nearby clinics for referral, with address and phone number |
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

Tap **Finish & save to history**. The screening and photo are saved and appear in History.

> **Save before looking for a clinic.** When a cataract is detected, the screen also shows
> **Find nearby clinic**. In the current version, tapping it opens the Clinics tab
> **without saving the screening**. Tap **Finish & save to history** first, then go to the
> Clinics tab.

## 5. Referring a patient and tracking the referral

1. Open the **Clinics** tab. Clinics are listed nearest first, with their address and phone
   number.
2. Tap **Refer patient** on the clinic you are sending the patient to. The button changes
   to **Referral sent**. (In this version this marks the clinic, not a specific patient.)
3. Track the patient's progress: open the **History** tab, tap the patient's screening,
   and under **Referral status** choose:
   - **Referred**: the patient has been sent to a clinic.
   - **Attended**: the patient went to the clinic.
   - **Treated**: the patient received treatment.

   Tap the selected status again to clear it ("Not referred").

The referral status belongs to the patient, not to one screening, so every screening of
that patient shows the same status. It also appears under the patient's name in History.

## 6. Reviewing past screenings

Open the **History** tab and tap any screening to see its full result again, including the
photo. Tap **Back to history** to return. Past screenings cannot be edited or deleted from
the app.

## 7. Profile and settings

The Profile tab shows your name, region and screening totals. **Notifications** can be
turned on or off, and **About the AI model** shows the model version. Language, Sync data,
Help & support and Log out are not active yet.

## 8. Troubleshooting

| Problem | What to do |
| --- | --- |
| "Camera access was denied" | Open phone **Settings → Apps → Cataract Screening → Permissions** and allow Camera, then reopen the app. |
| History or clinics are empty | Check the phone's internet connection, then close and reopen the app. |
| A screening didn't appear in History | It is only saved after **Finish & save to history**. Check the internet connection and screen again. |
| Android won't install the APK | Allow installs from unknown sources for the app you opened the file with. If an older copy was signed differently, uninstall it first. |
