import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Banner, Field } from '../components/ui';
import { EyeIcon } from '../components/icons';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { signIn, accountError, checkNeedsSetup } = useScreening();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  // On a brand-new backend there are no accounts yet: offer to create the first one.
  useEffect(() => {
    checkNeedsSetup().then(setNeedsSetup);
  }, [checkNeedsSetup]);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    // On success the app switches to the signed-in screens by itself.
    if (!res.ok) setError(res.error);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {navigation.canGoBack() && <BackLink label="Back" onPress={() => navigation.goBack()} />}
          <View style={styles.iconWrap}>
            <EyeIcon size={34} color={colors.brandDark} />
          </View>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            For health workers and clinic staff. Your account is set up by your programme’s health worker team.
          </Text>

          {(error || accountError) && <Banner text={(error ?? accountError) as string} />}

          <Field
            label="Email"
            value={email}
            onChangeText={v => {
              setEmail(v);
              setError(null);
            }}
            placeholder="name@example.org"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={v => {
              setPassword(v);
              setError(null);
            }}
            placeholder="Your password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submit}
          />
          <Text style={styles.help}>Forgot your password? Ask a health worker on your team to set up a new login for you.</Text>

          {needsSetup && (
            <Pressable style={styles.setup} onPress={() => navigation.navigate('Setup')}>
              <Text style={styles.setupTitle}>Setting up the app for the first time?</Text>
              <Text style={styles.setupBody}>No accounts exist yet. Create the first health worker account, then add your team.</Text>
              <Text style={styles.setupAction}>Create first account ›</Text>
            </Pressable>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Sign in" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: 22 },
  help: { fontSize: 12, lineHeight: 17, color: colors.textSubtle, marginTop: -4 },
  setup: { marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.brandTint, gap: 4 },
  setupTitle: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  setupBody: { fontSize: 12.5, lineHeight: 18, color: colors.textMuted2 },
  setupAction: { fontSize: 13, fontWeight: '700', color: colors.brand, marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
