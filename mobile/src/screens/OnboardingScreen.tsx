import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { ONBOARD_SLIDES } from '../data/content';
import { EyeIcon } from '../components/icons';
import { GhostButton, PrimaryButton } from '../components/Buttons';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const slide = ONBOARD_SLIDES[step];
  const isLast = step >= ONBOARD_SLIDES.length - 1;

  const finish = () => navigation.replace('Main');
  const next = () => (isLast ? finish() : setStep(s => s + 1));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <EyeIcon size={44} color={colors.brandDark} />
        </View>
        <View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.body}</Text>
        </View>
      </View>

      <View style={styles.dots}>
        {ONBOARD_SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { width: i === step ? 20 : 7, backgroundColor: i === step ? colors.brand : colors.border },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <GhostButton label="Skip" onPress={finish} />
        <View style={{ flex: 2 }}>
          <PrimaryButton label={slide.cta} onPress={next} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 16,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 26,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
