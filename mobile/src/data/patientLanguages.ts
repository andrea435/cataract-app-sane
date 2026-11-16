// Patient-facing consent text in the languages health workers read it in.
//
// Only what is read aloud to the patient is translated: the four-point summary and the two
// consent questions. Everything the health worker or clinic staff read stays in English.
//
// The translations below are drafts. Before using a language with real patients, have a
// first-language speaker (ideally one who has worked in health care) check it, then set
// `checked: true` and bump CONSENT_VERSION in content.ts.

export type PatientLanguage = 'en' | 'nd' | 'sn' | 'tn' | 'kck';

export interface ConsentText {
  summary: { title: string; body: string }[];
  /** Asked aloud before ticking "agrees to the screening". */
  screeningQuestion: string;
  /** Asked aloud before ticking "agrees to share with a clinic". */
  shareQuestion: string;
}

export interface PatientLanguageInfo {
  code: PatientLanguage;
  /** The language's own name, shown on the picker. */
  name: string;
  /** False until a first-language speaker has checked the text. */
  checked: boolean;
  /** Null when there is no translation yet: the English text is shown instead. */
  text: ConsentText | null;
}

export const DEFAULT_PATIENT_LANGUAGE: PatientLanguage = 'en';

const en: ConsentText = {
  summary: [
    { title: 'What we collect', body: 'Your name, patient ID if you have one, a photo of the front of your eye and the screening result.' },
    { title: 'Why', body: 'To check for signs of cataract and, if needed, to refer you to a clinic for treatment.' },
    { title: 'Who sees it', body: 'The health workers in this programme, and only the clinic you are referred to if you agree.' },
    { title: 'Your choice', body: 'Saying no does not affect your care. You can ask to see, correct or delete your information at any time.' },
  ],
  screeningQuestion: 'Do you agree to the eye check? We will take a photo of your eye and keep it with the result.',
  shareQuestion: 'If you need to go to a clinic, do you agree that we share your result with that clinic?',
};

// isiNdebele (Zimbabwe). Draft.
const nd: ConsentText = {
  summary: [
    {
      title: 'Esikuqoqayo',
      body: 'Ibizo lakho, inombolo yakho yesiguli nxa ulayo, umfanekiso wangaphambili welihlo lakho, lempumela yokuhlolwa.',
    },
    {
      title: 'Kungani',
      body: 'Ukuhlola izimpawu zekhatharakhi (ilifu elisehlweni), njalo nxa kufanele, ukukuthumela ekliniki ukuze welatshwe.',
    },
    {
      title: 'Ngubani obona ulwazi lwakho',
      body: 'Izisebenzi zempilo zalolu hlelo kuphela, lekliniki ozathunyelwa kuyo nxa uvuma.',
    },
    {
      title: 'Ukukhetha kwakho',
      body: 'Ukwala kakuyikuphazamisa ukwelatshwa kwakho. Ungacela ukubona, ukulungisa kumbe ukucitsha ulwazi lwakho loba nini.',
    },
  ],
  screeningQuestion: 'Uyavuma yini ukuhlolwa kwelihlo? Sizathatha umfanekiso welihlo lakho siwugcine lempumela.',
  shareQuestion: 'Nxa kufanele uye ekliniki, uyavuma yini ukuthi siyinike impumela yakho ikliniki leyo?',
};

// chiShona (Zimbabwe). Draft.
const sn: ConsentText = {
  summary: [
    {
      title: 'Zvatinotora',
      body: 'Zita rako, nhamba yako yemurwere kana uinayo, mufananidzo wemberi weziso rako, nemhedzisiro yekuongororwa.',
    },
    {
      title: 'Nei',
      body: 'Kuti tiongorore zviratidzo zvekatarakiti (gore muziso), uye kana zvichidikanwa, kukutumira kukiriniki kuti urapwe.',
    },
    {
      title: 'Vanozviona',
      body: 'Vashandi vehutano vechirongwa ichi chete, nekiriniki yaunotumirwa kana ukabvuma.',
    },
    {
      title: 'Sarudzo yako',
      body: 'Kuramba hakukanganisi kurapwa kwako. Unogona kukumbira kuona, kugadzirisa kana kudzima ruzivo rwako chero nguva.',
    },
  ],
  screeningQuestion: 'Unobvuma here kuongororwa ziso? Tichatora mufananidzo weziso rako uye tichauchengeta pamwe nemhedzisiro.',
  shareQuestion: 'Kana uchifanira kuenda kukiriniki, unobvuma here kuti tipe kiriniki iyoyo mhedzisiro yako?',
};

// Setswana. Draft.
const tn: ConsentText = {
  summary: [
    {
      title: 'Se re se kokoanyang',
      body: 'Leina la gago, nomoro ya gago ya molwetse fa o na le yone, setshwantsho sa karolo e e kwa pele ya leitlho la gago, le dipholo tsa tlhatlhobo.',
    },
    {
      title: 'Ka ntlha yang',
      body: 'Go leba matshwao a katarakete (leru mo leitlhong), mme fa go tlhokega, go go romela kwa tliliniking gore o alafiwe.',
    },
    {
      title: 'Ke mang yo o e bonang',
      body: 'Badiri ba boitekanelo ba lenaneo leno fela, le tliliniki e o romelwang kwa go yone fa o dumela.',
    },
    {
      title: 'Tlhopho ya gago',
      body: 'Go gana ga go ame tlhokomelo ya gago. O ka kopa go bona, go baakanya kgotsa go phimola tshedimosetso ya gago nako nngwe le nngwe.',
    },
  ],
  screeningQuestion: 'A o dumela gore leitlho la gago le tlhatlhobiwe? Re tla tsaya setshwantsho sa leitlho la gago re se boloke le dipholo.',
  shareQuestion: 'Fa o tshwanetse go ya kwa tliliniking, a o dumela gore re neye tliliniki eo dipholo tsa gago?',
};

export const PATIENT_LANGUAGES: PatientLanguageInfo[] = [
  { code: 'en', name: 'English', checked: true, text: en },
  { code: 'nd', name: 'isiNdebele', checked: false, text: nd },
  { code: 'sn', name: 'chiShona', checked: false, text: sn },
  { code: 'tn', name: 'Setswana', checked: false, text: tn },
  // TjiKalanga: no translation yet. A Kalanga speaker should write this one rather than
  // check a machine draft. Until then the English text is shown for the worker to interpret.
  { code: 'kck', name: 'TjiKalanga', checked: false, text: null },
];

export function patientLanguage(code: PatientLanguage): PatientLanguageInfo {
  return PATIENT_LANGUAGES.find(l => l.code === code) ?? PATIENT_LANGUAGES[0];
}

/** The text to read for a language, falling back to English when there is none yet. */
export function consentText(code: PatientLanguage): ConsentText {
  return patientLanguage(code).text ?? en;
}

export const ENGLISH_CONSENT_TEXT = en;
