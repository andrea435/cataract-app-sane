# Closing the gap from screening to treatment

## The problem

Cataract is the leading cause of blindness in the world, and one of the most treatable: a
short, low-cost operation usually restores sight. The World Health Organization's
*World report on vision* (2019) estimates that around 94 million people have moderate to
severe vision impairment or blindness from cataract that has not been treated.

Most of these people are not blind because treatment doesn't exist. They are blind because
they never reach it. The losses happen at every step:

1. **Not screened.** Eye specialists are concentrated in cities. In rural areas there may be
   no one who can examine an eye for hundreds of kilometres.
2. **Screened but not referred.** Community screening is often done on paper, so findings
   are lost, and there is no consistent rule for who needs a referral and how urgently.
3. **Referred but never attended.** Patients are told to "go to the clinic" with no
   specific facility, no follow-up and no one checking whether they went. Cost, distance and
   fear of surgery make many drop out here.
4. **Attended but not treated, or nobody knows.** Without a record that links the screening
   to the clinic visit, programmes can't tell how many of the people they found were
   actually operated on.

This drop-off between finding a patient and treating them is the patient-treatment gap.
WHO tracks it with an indicator called **effective cataract surgical coverage (eCSC)**, and
member states agreed at the 2021 World Health Assembly to raise eCSC by 30 percentage
points by 2030.

## How the app closes the gap

Each step above has a matching feature in the app.

| Where patients are lost | What the app does |
| --- | --- |
| No one to examine the eye | A community health worker with an ordinary smartphone can screen a patient in a couple of minutes, with no specialist equipment. Guided capture (an alignment circle and on-screen tips) helps non-specialists take a usable photo. |
| Findings are lost or inconsistent | Every screening is saved with the patient's name, ID, eye, probability, severity, photo, date and health worker, in a shared online history. The same thresholds are applied to every patient (below 50% clear; Mild, Moderate, Severe above that). |
| Unclear who to refer and how fast | The result screen gives a clear "Cataract detected" or "No cataract detected" and a severity, and the recommended steps tell the worker exactly what to do: refer within 2 weeks if detected, routine follow-up in 12 months if clear. |
| "Go to a clinic" with nowhere specific | The Clinics tab lists nearby referral clinics with address and phone number, so the worker can send the patient to a named facility. |
| No one follows up | Each patient has a **referral status** (Referred, Attended, Treated) that the worker updates on later visits. Patients who were referred but have not attended are visible in History and can be followed up. |
| No one knows the outcome | Because referral status is stored per patient, a programme can count how many people were screened, flagged, referred, attended and treated, and see exactly where they drop out. That is the data needed to measure eCSC locally. |

The result is a single chain from the first photo to the operation, instead of a series of
disconnected paper steps. The app doesn't replace the eye surgeon; it makes sure the
patients who need one actually get to one, and that someone can prove it.

## How it can work as a global tool

The design choices that make the app useful in one district also make it usable almost
anywhere cataract goes untreated.

- **Runs on hardware people already have.** An Android phone with a camera is enough. There
  is no slit lamp, retinal camera or laptop to buy, and the APK installs without an app
  store, which matters where Play Store access or accounts are limited.
- **Built for community health workers.** Many low- and middle-income countries already
  run large community health worker programmes. The app fits into that existing workforce
  instead of needing new specialists, and the screening flow takes a few minutes with
  minimal training (see the [user guide](user-guide.md)).
- **One shared, standard record.** Every programme that uses the app records the same
  fields and the same referral stages. That makes results comparable between districts,
  countries and partner organisations, and it lines up with the eCSC indicator that
  ministries of health and WHO already report on.
- **Easy to adapt locally.** The clinic list, the recommended steps, the worker's region
  and the app text live in data and a single content file, so each country can load its own
  referral facilities and guidelines. The settings screen already has a place for language
  selection.
- **Cheap to run and scale.** The backend is a hosted Supabase project. Adding more health
  workers or more countries does not need new servers to be built.
- **Ready for a better model.** The detection step is isolated in one function, so a model
  trained on local populations can be swapped in, and the version shown in the app updated,
  without changing the rest of the workflow.
- **Useful beyond the patient.** Aggregated data shows where cataract is most common,
  where referrals stall, and which clinics are overloaded. Health planners can use it to
  decide where to send surgical outreach camps.

## What is needed before wide use

To be honest about where the app is today, these steps come before using it with real
patients at scale:

1. **A real, validated detection model.** The probability score is currently simulated.
   A model must be trained on front-of-eye images, tested against diagnoses by
   ophthalmologists, and its accuracy published.
2. **Security and privacy.** Add sign-in for health workers and access rules so each worker
   or programme only sees its own patients, and meet local health data laws (for example
   consent, data residency and retention).
3. **Offline use.** Let screenings be saved on the phone and synced later, for areas with
   no signal.
4. **Translations** of the app text into local languages.
5. **Referral linked to the patient.** Record which clinic each patient was sent to, and let
   clinics confirm attendance and treatment directly.
6. **Clinical and regulatory approval** where screening software counts as a medical device.
7. **A field pilot** with a partner health programme, measuring how many flagged patients
   reach treatment compared with the existing process.
