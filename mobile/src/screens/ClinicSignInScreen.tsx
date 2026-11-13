import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Banner, EmptyState, Field } from '../components/ui';
import { HospitalIcon } from '../components/icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicSignIn'>;

export default function ClinicSignInScreen({ navigation }: Props) {
  const { clinics, signInClinic, loadError, refreshAll } = useScreening();
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!clinicId) return;
    if (signInClinic(clinicId, code)) {
      navigation.reset({ index: 0, routes: [{ name: 'ClinicHome' }] });
    } else {
      setError('That code doesn’t match this clinic. Ask the health worker who added your clinic for the code.');
    }
  };

  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Onboarding'));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Back" onPress={back} />
          <View style={styles.iconWrap}>
            <HospitalIcon size={30} color={colors.brandDark} />
          </View>
          <Text style={styles.title}>Clinic sign in</Text>
          <Text style={styles.subtitle}>See the patients health workers have referred to your clinic and record when they attend and are treated.</Text>

          {loadError && <Banner text="Couldn't load clinics. Check your connection." actionLabel="Retry" onAction={refreshAll} />}

          <Text style={styles.label}>Your clinic</Text>
          {clinics.length === 0 ? (
            <EmptyState title="No clinics registered" body="A health worker adds your clinic in the app's Clinics tab and shares its access code with you." />
          ) : (
            <View style={{ gap: 8, marginBottom: 20 }}>
              {clinics.map(c => {
                const selected = c.id === clinicId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setClinicId(c.id);
                      setError(null);
                    }}
                    style={[styles.option, selected && styles.optionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                    <Text style={styles.optionName}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {clinics.length > 0 && (
            <Field
              label="Access code"
              value={code}
              onChangeText={v => {
                setCode(v.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              error={error ?? undefined}
              style={{ letterSpacing: 4, fontSize: 18 }}
              onSubmitEditing={submit}
            />
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label="Open clinic view" onPress={submit} disabled={!clinicId || code.length !== 6} />
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
    marginTop: 8,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.textMuted, marginBottom: 22 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textLabelStrong, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  optionName: { fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
