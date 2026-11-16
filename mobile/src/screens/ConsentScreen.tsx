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
import { ConsentText, consentText, ENGLISH_CONSENT_TEXT, PATIENT_LANGUAGES, PatientLanguage, patientLanguage } from '../data/patientLanguages';
import { ConsentBy } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Consent'>;

// Shown after the patient's details and before the eye photo. The health worker reads the
// summary to the patient (or their parent or guardian) and records their answer.
// The language the summary was last read in, kept for the next patient while the app is open.
let lastLanguage: PatientLanguage = 'en';

export default function ConsentScreen({ navigation }: Props) {
  const { patientName, consent, setConsent, resetDraft, setActiveTab } = useScreening();
  const name = patientName.trim() || 'The patient';

  const [by, setBy] = useState<ConsentBy>(consent?.by ?? 'patient');
  const [guardianName, setGuardianName] = useState(consent?.guardianName ?? '');
  const [screening, setScreening] = useState(!!consent);
  const [share, setShare] = useState(consent?.share ?? false);
  const [language, setLanguageState] = useState<PatientLanguage>(lastLanguage);
  const setLanguage = (code: PatientLanguage) => {
    lastLanguage = code;
    setLanguageState(code);
  };
  const lang = patientLanguage(language);
  const text: ConsentText = consentText(language);
  const showEnglish = language !== 'en';

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
            <View>
              <Text style={styles.langLabel}>Read it in</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
                {PATIENT_LANGUAGES.map(l => {
                  const selected = l.code === language;
                  return (
                    <Pressable
                      key={l.code}
                      onPress={() => setLanguage(l.code)}
                      style={[styles.langChip, selected && styles.langChipSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text style={[styles.langChipText, selected && styles.langChipTextSelected]}>{l.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {!lang.checked && (
                <Text style={styles.langNote}>
                  {lang.text
                    ? `Draft ${lang.name} wording, not yet checked by a first-language speaker. The English is under each line.`
                    : `No ${lang.name} wording yet. Explain the English below in ${lang.name}.`}
                </Text>
              )}
            </View>
            {text.summary.map((item, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>{item.title}</Text>
                <Text style={styles.summaryBody}>{item.body}</Text>
                {showEnglish && lang.text && <Text style={styles.english}>{ENGLISH_CONSENT_TEXT.summary[i].body}</Text>}
              </View>
            ))}
            <View style={styles.askBox}>
              <Text style={styles.summaryTitle}>{showEnglish && lang.text ? 'Ask' : 'Then ask'}</Text>
              <Text style={styles.summaryBody}>{text.screeningQuestion}</Text>
              {showEnglish && lang.text && <Text style={styles.english}>{ENGLISH_CONSENT_TEXT.screeningQuestion}</Text>}
              <Text style={[styles.summaryBody, { marginTop: 6 }]}>{text.shareQuestion}</Text>
              {showEnglish && lang.text && <Text style={styles.english}>{ENGLISH_CONSENT_TEXT.shareQuestion}</Text>}
            </View>
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
              <Field label="Parent or guardian's name" value={guardianName} onChangeText={setGuardianName} placeholder="e.g. Nomsa Ncube" />
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
  english: { fontSize: 11.5, lineHeight: 16, color: colors.textSubtle, fontStyle: 'italic', marginTop: 2 },
  askBox: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10, gap: 2 },
  langLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textLabelStrong, marginBottom: 6 },
  langRow: { gap: 6 },
  langChip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBg },
  langChipSelected: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  langChipText: { fontSize: 12.5, fontWeight: '600', color: colors.textBody },
  langChipTextSelected: { color: colors.brandDark },
  langNote: { fontSize: 11.5, lineHeight: 16, color: colors.textMuted, marginTop: 8 },
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
