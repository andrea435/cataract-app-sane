import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { CheckRow, Field } from '../components/ui';
import { ShieldIcon } from '../components/icons';
import { CONSENT_SUMMARY } from '../data/content';
import { ConsentBy } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

// Shown after the patient's details and before the eye photo. The health worker reads the
// summary to the patient (or their parent or guardian) and records their answer.
export default function ConsentScreen({ navigation }: Props) {
  const { patientName, consent, setConsent, resetDraft, setActiveTab } = useScreening();
  const name = patientName.trim() || 'The patient';

  const [by, setBy] = useState<ConsentBy>(consent?.by ?? 'patient');
  const [guardianName, setGuardianName] = useState(consent?.guardianName ?? '');
  const [screening, setScreening] = useState(!!consent);
  const [share, setShare] = useState(consent?.share ?? false);

  const ready = screening && (by === 'patient' || !!guardianName.trim());

  const agree = () => {
    if (!ready) return;
    setConsent({ by, guardianName: guardianName.trim(), share, at: new Date().toISOString() });
    navigation.navigate('Capture');
  };

  const decline = () =>
    Alert.alert(
      'Stop this screening?',
      `Without consent no photo is taken and nothing about ${name} is saved. They can still go to a clinic for an eye examination.`,
      [
        { text: 'Go back', style: 'cancel' },
        {
          text: 'Stop screening',
          style: 'destructive',
          onPress: () => {
            resetDraft();
            setActiveTab('scan');
            navigation.navigate('Main');
          },
        },
      ]
    );

  const whoOption = (value: ConsentBy, label: string) => {
    const selected = by === value;
    return (
      <Pressable
        onPress={() => setBy(value)}
        style={[styles.option, { borderColor: selected ? colors.brand : colors.border, backgroundColor: selected ? colors.brandTint : 'transparent' }]}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
      >
        <Text style={[styles.optionText, { color: selected ? colors.brandDark : colors.textBody }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Back" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Patient consent</Text>
          <Text style={styles.subtitle}>Read this to {name === 'The patient' ? 'the patient' : name} in a language they understand before taking the photo.</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <ShieldIcon size={18} color={colors.brandDark} />
              </View>
              <Text style={styles.cardTitle}>How their information is used</Text>
            </View>
            {CONSENT_SUMMARY.map(item => (
              <View key={item.title} style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>{item.title}</Text>
                <Text style={styles.summaryBody}>{item.body}</Text>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('PrivacyNotice')} hitSlop={8} style={styles.noticeLink}>
              <Text style={styles.noticeLinkText}>Read the full privacy notice ›</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Consent given by</Text>
          <View style={styles.optionRow}>
            {whoOption('patient', 'The patient')}
            {whoOption('guardian', 'Parent or guardian')}
          </View>
          {by === 'guardian' && (
            <View style={{ marginTop: 14 }}>
              <Field label="Parent or guardian's name" value={guardianName} onChangeText={setGuardianName} placeholder="e.g. Grace Njoku" />
            </View>
          )}

          <View style={styles.checks}>
            <CheckRow
              checked={screening}
              onToggle={() => setScreening(v => !v)}
              label={`${name} agrees to the screening: a photo of the eye is taken and stored with the result.`}
            />
            <CheckRow
              checked={share}
              onToggle={() => setShare(v => !v)}
              label="Agrees to share the result with a clinic if they need a referral."
              hint="Optional. If they say no now, you can ask again when referring."
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Agreed, continue to capture" disabled={!ready} onPress={agree} />
          <Pressable onPress={decline} hitSlop={8} style={styles.decline}>
            <Text style={styles.declineText}>Patient does not agree</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 20, lineHeight: 19 },
  card: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 16, marginBottom: 22, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  summaryRow: { gap: 2 },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.textLabelStrong },
  summaryBody: { fontSize: 13, lineHeight: 19, color: colors.textBody },
  noticeLink: { alignSelf: 'flex-start', paddingTop: 2 },
  noticeLinkText: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textLabelStrong, marginBottom: 6 },
  optionRow: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 14, fontWeight: '600' },
  checks: { marginTop: 18, gap: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  decline: { alignSelf: 'center', paddingTop: 14, paddingBottom: 4 },
  declineText: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
