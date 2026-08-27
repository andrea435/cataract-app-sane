import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { RingGauge } from '../components/RingGauge';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { currentResult, viewOnly, setActiveTab } = useScreening();

  if (!currentResult) return null;
  const { status } = currentResult;

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
  thumbLabel: {
    fontSize: 11.5,
    color: colors.textMuted2,
    lineHeight: 16,
  },
});
