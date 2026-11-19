import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { analyseEyePhoto } from '../lib/eyeModel';
import { GhostButton, PrimaryButton } from '../components/Buttons';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanning'>;

// Keep the screen up at least this long so it doesn't flash past.
const MIN_SCAN_MS = 1200;

type Problem = { title: string; message: string; detail?: string } | null;

export default function ScanningScreen({ navigation }: Props) {
  const { capturedPhotoUri, captureFrame, setAnalysis, setActiveTab } = useScreening();
  const [problem, setProblem] = useState<Problem>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    spinLoop.start();

    Animated.sequence([
      Animated.timing(bar, { toValue: 0.78, duration: MIN_SCAN_MS, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.timing(bar, { toValue: 0.96, duration: 4000, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start();

    let cancelled = false;
    const started = Date.now();
    setAnalysis(null);
    (async () => {
      try {
        if (!capturedPhotoUri) throw new Error('No photo was taken');
        const result = await analyseEyePhoto(capturedPhotoUri, captureFrame);
        const wait = MIN_SCAN_MS - (Date.now() - started);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        if (cancelled) return;
        if (!result.isEye) {
          setProblem({
            title: 'No eye found in the photo',
            message: 'Take the photo again with the eye filling the circle, in good light and in focus.',
          });
          return;
        }
        setAnalysis(result);
        navigation.replace('Disclaimer');
      } catch (e) {
        if (cancelled) return;
        console.warn('Cataract model failed', e);
        setProblem({
          title: 'Could not analyse the photo',
          message: 'The detection model did not run on this photo. Try taking it again.',
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    })();
    return () => {
      cancelled = true;
      spinLoop.stop();
    };
  }, [navigation, spin, bar, capturedPhotoUri, captureFrame, setAnalysis]);

  if (problem) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{problem.title}</Text>
          <Text style={styles.subtitle}>{problem.message}</Text>
          {problem.detail ? <Text style={styles.detail} selectable>{problem.detail}</Text> : null}
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Retake photo" onPress={() => navigation.goBack()} />
          <GhostButton
            label="Cancel"
            onPress={() => {
              setActiveTab('scan');
              navigation.navigate('Main');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const width = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
      <View style={styles.textBlock}>
        <Text style={styles.title}>Analyzing image</Text>
        <Text style={styles.subtitle}>Running ML detection model on the captured eye image…</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 26,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.spinnerTrack,
    borderTopColor: colors.brand,
  },
  textBlock: {
    alignItems: 'center',
  },
  detail: {
    marginTop: 12,
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.trackBg,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
});
