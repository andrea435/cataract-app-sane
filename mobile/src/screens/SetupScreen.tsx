import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Banner, Field } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

// Creates the very first account (an admin health worker). The server only allows this
// while no accounts exist at all.
export default function SetupScreen({ navigation }: Props) {
  const { setupFirstAccount } = useScreening();
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!fullName.trim() && !!email.trim() && password.length >= 8;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const res = await setupFirstAccount({ full_name: fullName.trim(), region: region.trim(), email: email.trim(), password });
    setBusy(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Sign in" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Create the first account</Text>
          <Text style={styles.subtitle}>
            This will be an admin health worker account. You can then add other health workers from Profile, and clinic logins from
            each clinic.
          </Text>

          {error && <Banner text={error} />}

          <Field label="Your name" value={fullName} onChangeText={setFullName} placeholder="e.g. Naomi Achieng" autoCapitalize="words" />
          <Field label="Region (optional)" value={region} onChangeText={setRegion} placeholder="e.g. Kisumu County" />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.org"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            hint="At least 8 characters."
          />
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Create account and sign in" onPress={submit} loading={busy} disabled={!ready} />
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
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
