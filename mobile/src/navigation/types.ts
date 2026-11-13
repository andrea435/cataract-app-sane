export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  PatientInfo: undefined;
  Capture: undefined;
  Scanning: undefined;
  Disclaimer: undefined;
  Result: undefined;
  Recommend: undefined;
  // Health worker: add or edit a clinic (no id = add).
  ClinicForm: { clinicId?: string } | undefined;
  // Health worker: send a referral. With scanId, for a saved screening; without, for the
  // screening in progress (it is saved first).
  Refer: { scanId?: string } | undefined;
  // Clinic side.
  ClinicSignIn: undefined;
  ClinicHome: undefined;
  ClinicReferral: { referralId: string };
};
