export const ONBOARD_SLIDES = [
  {
    title: 'Screen for cataracts in the field',
    body: 'Capture a photo of the front of the eye and get an instant ML-based estimate to help prioritize referrals.',
    cta: 'Next',
  },
  {
    title: 'Fast, guided capture',
    body: 'Step-by-step alignment guidance helps you get a usable image even without clinical equipment.',
    cta: 'Next',
  },
  {
    title: 'Built for community screening',
    body: 'Track every patient you screen, flag urgent referrals, and connect them to nearby clinics.',
    cta: 'Get started',
  },
];

export const RECOMMEND_STEPS_DETECTED = [
  'Refer the patient to an ophthalmologist within 2 weeks.',
  'Document the finding and probability score in the patient record.',
  'Advise the patient to avoid straining the affected eye and to protect it from bright sunlight.',
  'Schedule a follow-up screening after the referral visit.',
];

export const RECOMMEND_STEPS_CLEAR = [
  'No referral is needed at this time.',
  'Advise routine eye protection (UV-blocking sunglasses, avoiding smoke exposure).',
  'Schedule a routine follow-up screening in 12 months.',
  'Log the result in the patient record for future comparison.',
];

export const DISCLAIMER_PARAGRAPHS = [
  'This tool provides an automated screening estimate for cataract presence based on image analysis of the front of the eye. It is not a medical diagnosis.',
  'Results should be used to help prioritize referrals, not to replace a clinical exam. All cases — especially those flagged as detected — should be confirmed by an ophthalmologist or trained eye care professional.',
  'Image quality, lighting, and patient cooperation can affect accuracy. Recapture the image if it is blurry or poorly lit.',
];

// ---- Patient consent and privacy notice (Zimbabwe Cyber and Data Protection Act) ----

/** Recorded with each screening; change it whenever the notice text below changes. */
export const CONSENT_VERSION = '2026-11-v1';

/** Who runs the screening programme and how to reach them (shown in the privacy notice). */
export const PRIVACY_CONTACT = {
  organisation: 'DreaLens',
  phone: '+263 77 343 9962',
  contact: 'your health worker, or call DreaLens on +263 77 343 9962',
};

// The short summary read to the patient, in each language, is in patientLanguages.ts.

/** The full notice, shown from the consent screen and from Profile. */
export const PRIVACY_NOTICE: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'Who is responsible',
    paragraphs: [
      `This app is used by ${PRIVACY_CONTACT.organisation}. They are responsible for your information. To ask a question or make a request, speak to ${PRIVACY_CONTACT.contact}.`,
    ],
  },
  {
    heading: 'What we collect',
    paragraphs: [
      'Your name and, if you give one, a patient ID (for example from a clinic card). A photo of the front of your eye. The screening result and estimated severity. The date, which eye was screened, and the health worker who screened you.',
      'If you are referred: the clinic, any note from the health worker, and the clinic\'s updates on whether you attended and were treated.',
      'This is health information, which the law treats as sensitive data. We only collect it with your consent.',
    ],
  },
  {
    heading: 'Why we collect it',
    paragraphs: [
      'To screen you for cataract, to refer you to a clinic if the screening suggests you need an eye examination, and to follow up that you were seen and treated.',
      'Numbers without names (how many people were screened, referred and treated) are used to run and improve the programme.',
    ],
  },
  {
    heading: 'Who can see it',
    paragraphs: [
      'Health workers in this programme who are signed in to the app. A clinic only sees your information if you are referred there and you agreed to share it with them.',
      'It is not sold or given to anyone else, unless the law requires it.',
    ],
  },
  {
    heading: 'How it is kept safe',
    paragraphs: [
      'Your information is stored on a secure online database that needs a personal login. Eye photos are private and only shown to people allowed to see them. Information waiting to upload is kept inside the app on the health worker\'s phone.',
      'It is kept only as long as needed for your care and the programme, then deleted.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'You can say no. Saying no does not affect your right to care: you can still go to a clinic for an eye examination.',
      'You can ask to see the information we hold about you, to correct it, or to delete it, and you can withdraw your consent at any time.',
      'If you are unhappy with how your information is handled you can complain to the Data Protection Authority, POTRAZ (Postal and Telecommunications Regulatory Authority of Zimbabwe), potraz.gov.zw.',
    ],
  },
  {
    heading: 'Children and people who cannot consent',
    paragraphs: ['For a child, or an adult who cannot decide for themselves, a parent or guardian gives consent on their behalf.'],
  },
];

/** Plain-language facts about the detection model, shown on the "About the AI model" screen. */
export const ABOUT_MODEL: { heading: string; paragraphs: string[] }[] = [
  {
    heading: 'What it does',
    paragraphs: [
      'The app looks at a photo of the front of the eye and estimates how likely it is that the eye has a cataract. The percentage on the result is how confident the model is.',
      'It is a screening aid, not a diagnosis. Every patient flagged should be seen by an eye care professional.',
    ],
  },
  {
    heading: 'How it works',
    paragraphs: [
      'The model is a VGG19 neural network trained on labelled eye photos. It sorts each photo into one of three groups: cataract, normal eye, or not a usable eye photo.',
      'It runs on this phone, so screening works without signal. The photo is not sent anywhere to be analysed.',
    ],
  },
  {
    heading: 'Getting a good result',
    paragraphs: [
      'Use good light and hold the phone steady. Fill the circle with the eye and keep the eye open. If the photo is blurry or the app says it is not an eye, take it again.',
    ],
  },
];
