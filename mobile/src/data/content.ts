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

// ---- Patient consent and privacy notice (POPIA-style) ----

/** Recorded with each screening; change it whenever the notice text below changes. */
export const CONSENT_VERSION = '2026-11-v1';

/**
 * Who runs the screening programme and how to reach them. Fill these in for your
 * programme before using the app with real patients.
 */
export const PRIVACY_CONTACT = {
  organisation: 'the community eye screening programme',
  contact: 'your health worker or the programme coordinator',
};

/** Short version read to the patient on the consent screen. */
export const CONSENT_SUMMARY = [
  { title: 'What we collect', body: 'Your name, patient ID if you have one, a photo of the front of your eye and the screening result.' },
  { title: 'Why', body: 'To check for signs of cataract and, if needed, to refer you to a clinic for treatment.' },
  { title: 'Who sees it', body: 'The health workers in this programme, and only the clinic you are referred to if you agree.' },
  { title: 'Your choice', body: 'Saying no does not affect your care. You can ask to see, correct or delete your information at any time.' },
];

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
      'This is health information, which the law treats as special personal information. We only collect it with your consent.',
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
      'If you are unhappy with how your information is handled you can complain to the Information Regulator (South Africa), inforeg.org.za.',
    ],
  },
  {
    heading: 'Children and people who cannot consent',
    paragraphs: ['For a child, or an adult who cannot decide for themselves, a parent or guardian gives consent on their behalf.'],
  },
];
