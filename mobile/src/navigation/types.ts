export type RootStackParamList = {
  // Signed out
  Onboarding: undefined;
  SignIn: undefined;
  // First launch on a new backend: create the first (admin) health worker account.
  Setup: undefined;

  // Health worker
  Main: undefined;
  PatientInfo: undefined;
  Capture: undefined;
  Scanning: undefined;
  Disclaimer: undefined;
  Result: undefined;
  Recommend: undefined;
  // Add or edit a clinic (no id = add).
  ClinicForm: { clinicId?: string } | undefined;
  // Send a referral. With scanId, for a saved screening; without, for the screening in
  // progress (it is saved first).
  Refer: { scanId?: string } | undefined;
  // Health workers on the team (admins can add and remove them).
  Team: undefined;
  // Create a login: another health worker, or staff of one clinic.
  AddAccount: { kind: 'worker' } | { kind: 'clinic'; clinicId: string };

  // Both roles
  ChangePassword: undefined;

  // Clinic staff
  ClinicHome: undefined;
  ClinicReferral: { referralId: string };
};
