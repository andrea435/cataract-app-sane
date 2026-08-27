import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Eye } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientInfo'>;

export default function PatientInfoScreen({ navigation }: Props) {
  const { patientName, setPatientName, patientId, setPatientId, eye, setEye, setActiveTab } = useScreening();

  const incomplete = !patientName.trim();

  const back = () => {
    setActiveTab('scan');
    navigation.navigate('Main');
  };

  const eyeOption = (value: Eye, label: string) => {
    const selected = eye === value;
    return (
      <Pressable
        onPress={() => setEye(value)}
        style={[
          styles.eyeButton,
          {
            borderColor: selected ? colors.brand : colors.border,
            backgroundColor: selected ? colors.brandTint : 'transparent',
          },
        ]}
      >
        <Text style={[styles.eyeButtonText, { color: selected ? colors.brandDark : colors.textBody }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <BackLink label="Back" onPress={back} />
      <Text style={styles.title}>New Screening</Text>
      <Text style={styles.subtitle}>Enter patient details before capturing the eye image.</Text>

      <Text style={styles.label}>Patient name</Text>
      <TextInput
        value={patientName}
        onChangeText={setPatientName}
        placeholder="e.g. Amara Njoku"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
      />

      <Text style={styles.label}>Patient ID (optional)</Text>
      <TextInput
        value={patientId}
        onChangeText={setPatientId}
        placeholder="e.g. CHW-00214"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
      />

      <Text style={styles.label}>Eye being screened</Text>
      <View style={styles.eyeRow}>
        {eyeOption('Left', 'Left eye')}
        {eyeOption('Right', 'Right eye')}
      </View>

      <View style={{ flex: 1 }} />

      <PrimaryButton
        label="Continue to capture"
        disabled={incomplete}
        onPress={() => navigation.navigate('Capture')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    marginBottom: 26,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textLabelStrong,
    marginBottom: 6,
  },
  input: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14.5,
    marginBottom: 18,
    color: colors.ink,
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  eyeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
