import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { OutlineButton, PrimaryButton } from '../components/Buttons';
import { RECOMMEND_STEPS_CLEAR, RECOMMEND_STEPS_DETECTED } from '../data/content';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommend'>;

export default function RecommendScreen({ navigation }: Props) {
  const { currentResult, setActiveTab, saving, finishAndSave } = useScreening();

  if (!currentResult) return null;
  const { status } = currentResult;
  const steps = status.detected ? RECOMMEND_STEPS_DETECTED : RECOMMEND_STEPS_CLEAR;

  const findClinic = () => {
    setActiveTab('clinics');
    navigation.navigate('Main');
  };

  const finish = async () => {
    await finishAndSave();
    setActiveTab('scan');
    navigation.navigate('Main');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Text style={styles.title}>Recommended steps</Text>
      <Text style={styles.subtitle}>
        Based on the {currentResult.probability}% {status.statusLabelLower} result for {currentResult.name}.
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepList}>
        {steps.map((text, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepIndex, { backgroundColor: status.statusBg }]}>
              <Text style={[styles.stepIndexText, { color: status.statusColor }]}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        {status.detected && <OutlineButton label="Find nearby clinic" onPress={findClinic} />}
        <PrimaryButton label="Finish & save to history" onPress={finish} loading={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 22,
  },
  stepList: {
    gap: 12,
    paddingBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textStrong,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
});
