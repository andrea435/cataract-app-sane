import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { PrimaryButton } from '../components/Buttons';
import { DISCLAIMER_PARAGRAPHS } from '../data/content';

type Props = NativeStackScreenProps<RootStackParamList, 'Disclaimer'>;

export default function DisclaimerScreen({ navigation }: Props) {
  const { disclaimerChecked, setDisclaimerChecked, computeCurrentResult } = useScreening();

  const viewResults = () => {
    if (!disclaimerChecked) return;
    computeCurrentResult();
    navigation.navigate('Result');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Text style={styles.title}>Before you continue</Text>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 8 }}>
        {DISCLAIMER_PARAGRAPHS.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}
      </ScrollView>

      <Pressable style={styles.checkRow} onPress={() => setDisclaimerChecked(!disclaimerChecked)}>
        <View style={[styles.checkbox, disclaimerChecked && styles.checkboxChecked]}>
          {disclaimerChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>I understand this is a screening aid, not a diagnosis.</Text>
      </Pressable>

      <PrimaryButton label="View results" disabled={!disclaimerChecked} onPress={viewResults} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.ink,
  },
  body: {
    flex: 1,
  },
  paragraph: {
    fontSize: 13.5,
    lineHeight: 23,
    color: colors.textBody,
    marginBottom: 14,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 16,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textLabel,
    lineHeight: 19,
  },
});
