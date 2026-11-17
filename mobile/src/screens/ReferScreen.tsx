import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, OutlineButton, PrimaryButton } from '../components/Buttons';
import { Banner, EmptyState, Field } from '../components/ui';
import { CheckIcon, CloudIcon, PlusIcon, SendIcon } from '../components/icons';
import { statusFields } from '../data/types';
import { formatScannedAt } from '../data/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Refer'>;

export default function ReferScreen({ navigation, route }: Props) {
  const { clinics, history, currentResult, finishAndSave, sendReferral, setActiveTab } = useScreening();
  const scanId = route.params?.scanId;
  const savedScan = scanId ? history.find(h => h.id === scanId) : undefined;

  const [clinicId, setClinicId] = useState<string | null>(clinics.length === 1 ? clinics[0].id : null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ clinic: string; patient: string; queued: boolean } | null>(null);
  // Once the in-progress screening is saved, keep it so a retry doesn't save it twice.
  const savedDraft = useRef<Awaited<ReturnType<typeof finishAndSave>>>(null);

  // What we're referring: a saved screening, or the one still in progress.
  const summary = savedScan
    ? {
        name: savedScan.patient_name,
        meta: `${savedScan.eye_label} · ${formatScannedAt(savedScan.scanned_at)}`,
        probability: savedScan.probability,
        status: statusFields(savedScan.probability, colors),
      }
    : savedDraft.current
      ? {
          name: savedDraft.current.patient_name,
          meta: `${savedDraft.current.eye_label} · ${formatScannedAt(savedDraft.current.scanned_at)}`,
          probability: savedDraft.current.probability,
          status: statusFields(savedDraft.current.probability, colors),
        }
      : currentResult
      ? { name: currentResult.name, meta: `${currentResult.eyeLabel} · ${currentResult.date}`, probability: currentResult.probability, status: currentResult.status }
      : null;

  const send = async () => {
    if (!clinicId) return;
    setBusy(true);
    setError(null);
    try {
      // A screening in progress is saved first so the clinic gets its photo and score.
      if (!savedScan && !savedDraft.current) savedDraft.current = await finishAndSave();
      const scan = savedScan ?? savedDraft.current;
      if (!scan) {
        setError("The screening couldn't be saved. Try again.");
        return;
      }
      const res = await sendReferral({ scan, clinicId, note });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent({ clinic: clinics.find(c => c.id === clinicId)?.name ?? 'the clinic', patient: scan.patient_name, queued: res.value.queued });
    } finally {
      setBusy(false);
    }
  };

  const done = () => {
    if (savedScan) {
      navigation.goBack();
    } else {
      setActiveTab('scan');
      navigation.navigate('Main');
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.screen, styles.successScreen]} edges={['top', 'bottom']}>
        <View style={styles.successBody}>
          <View style={[styles.successIcon, sent.queued && { backgroundColor: colors.warningBg }]}>
            {sent.queued ? <CloudIcon size={38} color={colors.warning} /> : <CheckIcon size={36} color={colors.successDark} />}
          </View>
          <Text style={styles.successTitle}>{sent.queued ? 'Referral saved' : 'Referral sent'}</Text>
          <Text style={styles.successText}>
            {sent.queued
              ? `No signal right now, so the referral of ${sent.patient} to ${sent.clinic} is saved on this phone. It is sent automatically as soon as you have signal.`
              : `${sent.patient} has been referred to ${sent.clinic}. The clinic sees it in their clinic view, and you'll see it move to attended and treated as they update it.`}
          </Text>
        </View>
        <PrimaryButton label="Done" onPress={done} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Back" onPress={() => (savedDraft.current ? done() : navigation.goBack())} />
          <Text style={styles.title}>Refer to a clinic</Text>
          <Text style={styles.subtitle}>Choose where the patient should go for confirmation and treatment.</Text>

          {summary && (
            <View style={styles.patientCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{summary.name}</Text>
                <Text style={styles.patientMeta}>{summary.meta}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: summary.status.statusBg }]}>
                <Text style={[styles.pillText, { color: summary.status.statusColor }]}>
                  {summary.probability}%{summary.status.severity ? ` · ${summary.status.severity}` : ''}
                </Text>
              </View>
            </View>
          )}

          {error && <Banner text={error} />}

          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Clinic</Text>
            {clinics.length > 0 && (
              <Pressable onPress={() => navigation.navigate('ClinicForm')} hitSlop={8} style={styles.inlineAdd}>
                <PlusIcon size={13} color={colors.brand} />
                <Text style={styles.inlineAddText}>Add clinic</Text>
              </Pressable>
            )}
          </View>

          {clinics.length === 0 ? (
            <EmptyState title="No clinics yet" body="Add the clinic you want to refer this patient to.">
              <OutlineButton label="Add clinic" onPress={() => navigation.navigate('ClinicForm')} />
            </EmptyState>
          ) : (
            <View style={{ gap: 10, marginBottom: 20 }}>
              {clinics.map(c => {
                const selected = c.id === clinicId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setClinicId(c.id)}
                    style={[styles.option, selected && styles.optionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionName}>{c.name}</Text>
                      {(!!c.address || !!c.distance) && (
                        <Text style={styles.optionMeta} numberOfLines={1}>
                          {[c.distance, c.address].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {clinics.length > 0 && (
            <Field
              label="Note for the clinic (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Blurred vision for 6 months, needs transport support"
              multiline
              style={{ minHeight: 84, textAlignVertical: 'top' }}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={savedScan || savedDraft.current ? 'Send referral' : 'Save & send referral'}
            onPress={send}
            disabled={!clinicId}
            loading={busy}
            icon={!busy ? <SendIcon /> : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 20 },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 20,
  },
  patientName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  patientMeta: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textLabelStrong },
  inlineAdd: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineAddText: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
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
  optionName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  optionMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  successScreen: { paddingHorizontal: 24, paddingBottom: 20 },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 21, fontWeight: '700', color: colors.ink },
  successText: { fontSize: 14, lineHeight: 21, color: colors.textMuted, textAlign: 'center', maxWidth: 300 },
});
