import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, OutlineButton, PrimaryButton } from '../components/Buttons';
import { RingGauge } from '../components/RingGauge';
import { Banner, PendingChip, StatusStepper } from '../components/ui';
import { CloudIcon } from '../components/icons';
import { formatShortDate } from '../data/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { currentResult, viewOnly, setActiveTab, history, referrals, latestReferralFor, updateReferral } = useScreening();

  if (!currentResult) return null;
  const { status } = currentResult;
  // Referral status can only be tracked once the scan is saved.
  const scan = currentResult.id ? history.find(h => h.id === currentResult.id) : undefined;
  const patient = scan?.patient;
  // A referral still waiting on the phone is linked by its screening.
  const referral = latestReferralFor(patient?.id) ?? (scan ? referrals.find(r => r.pending && r.scan_id === scan.id) : undefined);

  const back = () => {
    if (viewOnly) {
      setActiveTab('history');
      navigation.navigate('Main');
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label={viewOnly ? 'Back to history' : 'Back'} onPress={back} />
        <Text style={styles.meta}>
          {currentResult.name} · {currentResult.eyeLabel} · {currentResult.date}
        </Text>

        <View style={styles.ringSection}>
          <RingGauge probability={currentResult.probability} color={status.statusColor} />
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusPill, { backgroundColor: status.statusBg }]}>
            <Text style={[styles.statusPillText, { color: status.statusColor }]}>{status.statusLabel}</Text>
          </View>
          {status.detected && (
            <Text style={styles.severity}>
              Estimated severity: <Text style={styles.severityStrong}>{status.severity}</Text>
            </Text>
          )}
        </View>

        <View style={styles.photoCard}>
          <View style={styles.thumb}>
            {currentResult.photoUri ? (
              <Image source={{ uri: currentResult.photoUri }} style={styles.thumbImage} />
            ) : (
              <View style={styles.thumbPlaceholder} />
            )}
          </View>
          <Text style={styles.thumbLabel}>captured{'\n'}eye image</Text>
        </View>

        {scan?.pending && (
          <Banner
            tone="warning"
            icon={<CloudIcon size={18} color={colors.warning} />}
            text="Saved on this phone. It uploads automatically when you have signal."
          />
        )}

        {referral?.pending ? (
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Text style={styles.referralTitle}>Referral to {referral.clinic?.name ?? 'clinic'}</Text>
              <PendingChip label="Waiting to send" />
            </View>
            <Text style={styles.clinicNoteText}>It is sent to the clinic as soon as you have signal.</Text>
          </View>
        ) : referral && (
          <View style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Text style={styles.referralTitle}>Referred to {referral.clinic?.name ?? 'clinic'}</Text>
              <Text style={styles.referralDate}>{formatShortDate(referral.created_at)}</Text>
            </View>
            <StatusStepper status={referral.status} onSelect={s => s !== referral.status && updateReferral(referral.id, { status: s })} />
            {!!referral.clinic_note && (
              <View style={styles.clinicNote}>
                <Text style={styles.clinicNoteLabel}>Note from clinic</Text>
                <Text style={styles.clinicNoteText}>{referral.clinic_note}</Text>
              </View>
            )}
          </View>
        )}

        {(patient || scan?.pending) && !referral && status.detected && (
          <View style={{ marginBottom: 12 }}>
            <OutlineButton label="Refer to a clinic" onPress={() => navigation.navigate('Refer', { scanId: currentResult.id ?? undefined })} />
          </View>
        )}

        <PrimaryButton label="View recommended steps" onPress={() => navigation.navigate('Recommend')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },
  meta: {
    textAlign: 'center',
    fontSize: 12.5,
    color: colors.textMuted,
    marginBottom: 2,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  statusSection: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusPillText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  severity: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
  severityStrong: {
    color: colors.textStrong,
    fontWeight: '700',
  },
  photoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.placeholderStripe,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: colors.placeholderStripe,
  },
  referralCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 14,
  },
  referralTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textLabel,
  },
  referralDate: {
    fontSize: 11.5,
    color: colors.textSubtle,
  },
  clinicNote: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 4,
  },
  clinicNoteLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
  },
  clinicNoteText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textBody,
  },
  thumbLabel: {
    fontSize: 11.5,
    color: colors.textMuted2,
    lineHeight: 16,
  },
});
