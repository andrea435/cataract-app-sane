import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { RingGauge } from '../components/RingGauge';
import { REFERRAL_STATUSES } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { currentResult, viewOnly, setActiveTab, history, setReferralStatus } = useScreening();

  if (!currentResult) return null;
  const { status } = currentResult;
  // Referral status can only be tracked once the scan is saved.
  const patient = currentResult.id ? history.find(h => h.id === currentResult.id)?.patient : undefined;

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

        {patient && (
          <View style={styles.referralCard}>
            <Text style={styles.referralTitle}>Referral status</Text>
            <View style={styles.referralOptions}>
              {REFERRAL_STATUSES.map(opt => {
                const active = patient.referral_status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.referralOption, active && styles.referralOptionActive]}
                    onPress={() => setReferralStatus(patient.id, active ? null : opt.value)}
                  >
                    <Text style={[styles.referralOptionText, active && styles.referralOptionTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
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
  referralTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textLabel,
    marginBottom: 10,
  },
  referralOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  referralOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  referralOptionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTint,
  },
  referralOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  referralOptionTextActive: {
    color: colors.brandDark,
  },
  thumbLabel: {
    fontSize: 11.5,
    color: colors.textMuted2,
    lineHeight: 16,
  },
});
