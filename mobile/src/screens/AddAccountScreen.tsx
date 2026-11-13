import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Banner, Field } from '../components/ui';
import { CheckIcon } from '../components/icons';
import { suggestPassword } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAccount'>;

// Creates a login for another health worker, or for staff of one clinic. Accounts are ready
// to use at once (no email confirmation); the worker passes the sign-in details on in person
// or by message.
export default function AddAccountScreen({ navigation, route }: Props) {
  const { clinics, createWorker, createClinicLogin } = useScreening();
  const params = route.params;
  const clinic = params.kind === 'clinic' ? clinics.find(c => c.id === params.clinicId) : undefined;
  const isWorker = params.kind === 'worker';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(suggestPassword);
  const [region, setRegion] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const ready = !!fullName.trim() && !!email.trim() && password.length >= 8;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const base = { full_name: fullName.trim(), email: email.trim(), password };
    const res =
      params.kind === 'worker'
        ? await createWorker({ ...base, region: region.trim(), is_admin: isAdmin })
        : await createClinicLogin(params.clinicId, base);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else setCreated(true);
  };

  if (created) {
    return (
      <SafeAreaView style={[styles.screen, styles.successScreen]} edges={['top', 'bottom']}>
        <View style={styles.successBody}>
          <View style={styles.successIcon}>
            <CheckIcon size={36} color={colors.successDark} />
          </View>
          <Text style={styles.successTitle}>Login created</Text>
          <Text style={styles.successText}>
            Share these sign-in details with {fullName.trim()}
            {clinic ? ` at ${clinic.name}` : ''}. They sign in from the first screen of the app.
          </Text>
          <View style={styles.credentials}>
            <Text style={styles.credLabel}>Email</Text>
            <Text style={styles.credValue} selectable>
              {email.trim().toLowerCase()}
            </Text>
            <Text style={[styles.credLabel, { marginTop: 10 }]}>Password</Text>
            <Text style={styles.credValue} selectable>
              {password}
            </Text>
          </View>
          <Text style={styles.successHint}>The password isn’t shown again. If it’s lost, remove this login and add a new one.</Text>
        </View>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Back" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>{isWorker ? 'Add health worker' : 'Add clinic login'}</Text>
          <Text style={styles.subtitle}>
            {isWorker
              ? 'They will be able to screen patients, manage clinics and send referrals.'
              : `For staff at ${clinic?.name ?? 'this clinic'}. They will see only the patients referred to this clinic.`}
          </Text>

          {error && <Banner text={error} />}

          <Field label="Name" value={fullName} onChangeText={setFullName} placeholder={isWorker ? 'e.g. Joseph Otieno' : 'e.g. Dr. Akinyi Odhiambo'} autoCapitalize="words" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.org"
            keyboardType="email-address"
            autoCapitalize="none"
            hint="Used to sign in. No email is sent."
          />
          <Field
            label="Temporary password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            hint="At least 8 characters. You’ll see it again on the next screen to pass on."
          />
          <Pressable onPress={() => setPassword(suggestPassword())} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: -8, marginBottom: 16 }}>
            <Text style={styles.link}>Suggest another password</Text>
          </Pressable>

          {isWorker && (
            <>
              <Field label="Region (optional)" value={region} onChangeText={setRegion} placeholder="e.g. Kisumu County" />
              <Pressable style={styles.toggleRow} onPress={() => setIsAdmin(v => !v)} accessibilityRole="switch" accessibilityState={{ checked: isAdmin }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Admin</Text>
                  <Text style={styles.toggleHint}>Can add and remove other health workers.</Text>
                </View>
                <View style={[styles.toggle, { backgroundColor: isAdmin ? colors.brand : colors.border }]}>
                  <View style={[styles.toggleKnob, { left: isAdmin ? 19 : 2 }]} />
                </View>
              </Pressable>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Create login" onPress={submit} loading={busy} disabled={!ready} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: 22 },
  link: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  toggleLabel: { fontSize: 13.5, fontWeight: '600', color: colors.textPrimary },
  toggleHint: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  toggle: { width: 40, height: 23, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white, position: 'absolute' },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  successScreen: { paddingHorizontal: 24, paddingBottom: 20 },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 21, fontWeight: '700', color: colors.ink },
  successText: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', maxWidth: 310 },
  credentials: { alignSelf: 'stretch', padding: 16, borderRadius: 14, backgroundColor: colors.brandTint },
  credLabel: { fontSize: 12, fontWeight: '600', color: colors.brandDark },
  credValue: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 2 },
  successHint: { fontSize: 12, lineHeight: 17, color: colors.textSubtle, textAlign: 'center', maxWidth: 300 },
});
