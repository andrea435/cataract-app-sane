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

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

// Lets anyone replace the temporary password they were given with their own.
export default function ChangePasswordScreen({ navigation }: Props) {
  const { changePassword } = useScreening();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = !!confirm && confirm !== password;
  const ready = password.length >= 8 && confirm === password;

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    const res = await changePassword(password);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else setDone(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Back" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Change password</Text>
          <Text style={styles.subtitle}>Choose a password only you know. You stay signed in on this phone.</Text>

          {error && <Banner text={error} />}
          {done && <Banner tone="success" text="Password changed. Use it next time you sign in." />}

          <Field
            label="New password"
            value={password}
            onChangeText={v => {
              setPassword(v);
              setDone(false);
            }}
            placeholder="At least 8 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Field
            label="Type it again"
            value={confirm}
            onChangeText={v => {
              setConfirm(v);
              setDone(false);
            }}
            placeholder="Same password"
            secureTextEntry
            autoCapitalize="none"
            error={mismatch ? "The two passwords don't match." : undefined}
          />
        </ScrollView>
        <View style={styles.footer}>
          {done ? (
            <PrimaryButton label="Done" onPress={() => navigation.goBack()} />
          ) : (
            <PrimaryButton label="Change password" onPress={submit} loading={busy} disabled={!ready} />
          )}
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
