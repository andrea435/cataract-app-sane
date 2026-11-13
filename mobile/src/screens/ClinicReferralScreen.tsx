import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, OutlineButton, PrimaryButton } from '../components/Buttons';
import { RingGauge } from '../components/RingGauge';
import { Banner, Field, StatusStepper } from '../components/ui';
import { nextReferralStatus, statusFields } from '../data/types';
import { formatScannedAt, formatShortDate } from '../data/format';
import { EYE_CAPTURES_BUCKET, supabase } from '../lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicReferral'>;

const NEXT_LABEL = { attended: 'Mark as attended', treated: 'Mark as treated' } as const;

export default function ClinicReferralScreen({ navigation, route }: Props) {
  const { referrals, updateReferral } = useScreening();
  const referral = referrals.find(r => r.id === route.params.referralId);

  const [note, setNote] = useState(referral?.clinic_note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  // If another device updates the note while this screen is open, show the new value.
  useEffect(() => {
    setNote(referral?.clinic_note ?? '');
  }, [referral?.clinic_note]);

  if (!referral) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <BackLink label="Referrals" onPress={() => navigation.goBack()} />
          <Text style={styles.subtitle}>This referral is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scan = referral.scan;
  const result = scan ? statusFields(scan.probability, colors) : null;
  const photoUri = scan?.photo_path ? supabase.storage.from(EYE_CAPTURES_BUCKET).getPublicUrl(scan.photo_path).data.publicUrl : null;
  const next = nextReferralStatus(referral.status);
  const noteChanged = (note.trim() || null) !== (referral.clinic_note ?? null);

  const run = async (patch: Parameters<typeof updateReferral>[1]) => {
    setBusy(true);
    setError(null);
    const res = await updateReferral(referral.id, patch);
    setBusy(false);
    if (!res.ok) setError(res.error);
    return res.ok;
  };

  const saveNote = async () => {
    if (await run({ clinic_note: note.trim() || null })) setSavedNote(true);
  };

  const details: [string, string][] = [
    ['Patient ID', referral.patient?.external_id ?? 'Not recorded'],
    ['Eye', scan?.eye_label ?? 'Unknown'],
    ['Screened', scan ? formatScannedAt(scan.scanned_at) : 'Unknown'],
    ['Referred by', `${referral.worker_name} · ${formatShortDate(referral.created_at)}`],
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Referrals" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>{referral.patient?.name ?? 'Patient'}</Text>
          <Text style={styles.subtitle}>Referred to {referral.clinic?.name ?? 'your clinic'}</Text>

          {error && <Banner text={error} />}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Referral status</Text>
            <StatusStepper status={referral.status} onSelect={s => s !== referral.status && run({ status: s })} />
            <Text style={styles.updated}>Last updated {formatShortDate(referral.updated_at)}</Text>
          </View>

          {scan && result && (
            <View style={styles.screening}>
              <View style={styles.screeningLeft}>
                <RingGauge probability={scan.probability} color={result.statusColor} size={104} />
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.cardTitle}>Screening result</Text>
                <View style={[styles.pill, { backgroundColor: result.statusBg }]}>
                  <Text style={[styles.pillText, { color: result.statusColor }]}>{result.statusLabel}</Text>
                </View>
                {result.severity && (
                  <Text style={styles.severity}>
                    Estimated severity: <Text style={styles.severityStrong}>{result.severity}</Text>
                  </Text>
                )}
                <Text style={styles.disclaimer}>AI screening aid. Confirm with a full eye examination.</Text>
              </View>
            </View>
          )}

          {photoUri && (
            <View style={styles.photoWrap}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <Text style={styles.photoCaption}>Eye image captured at screening</Text>
            </View>
          )}

          <View style={styles.card}>
            {details.map(([k, v]) => (
              <View key={k} style={styles.detailRow}>
                <Text style={styles.detailKey}>{k}</Text>
                <Text style={styles.detailValue}>{v}</Text>
              </View>
            ))}
            {!!referral.worker_note && (
              <View style={styles.workerNote}>
                <Text style={styles.detailKey}>Note from health worker</Text>
                <Text style={styles.workerNoteText}>{referral.worker_note}</Text>
              </View>
            )}
          </View>

          <Field
            label="Clinic notes"
            value={note}
            onChangeText={v => {
              setNote(v);
              setSavedNote(false);
            }}
            placeholder="e.g. Confirmed cataract, surgery booked for 2 Dec"
            multiline
            style={{ minHeight: 84, textAlignVertical: 'top' }}
            hint={savedNote ? 'Saved. The health worker can see this note.' : 'Visible to the health worker who referred the patient.'}
          />
          {noteChanged && <OutlineButton label="Save note" onPress={saveNote} />}

        </ScrollView>

        {next && (
          <View style={styles.footer}>
            <PrimaryButton label={NEXT_LABEL[next as keyof typeof NEXT_LABEL]} onPress={() => run({ status: next })} loading={busy} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  card: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 12.5, fontWeight: '600', color: colors.textLabel, marginBottom: 12 },
  updated: { fontSize: 11.5, color: colors.textSubtle, marginTop: 12 },
  screening: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 16, marginBottom: 16 },
  screeningLeft: { alignItems: 'center' },
  pill: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16 },
  pillText: { fontSize: 12.5, fontWeight: '700' },
  severity: { fontSize: 12.5, color: colors.textMuted },
  severityStrong: { color: colors.textStrong, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: colors.textSubtle, lineHeight: 15 },
  photoWrap: { marginBottom: 16 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: colors.placeholderStripe },
  photoCaption: { fontSize: 11.5, color: colors.textSubtle, marginTop: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  detailKey: { fontSize: 12.5, color: colors.textMuted },
  detailValue: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
  workerNote: { marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider, gap: 4 },
  workerNoteText: { fontSize: 13, lineHeight: 19, color: colors.textBody },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
