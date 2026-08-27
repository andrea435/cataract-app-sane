import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanning'>;

const SCAN_DURATION_MS = 2000;

export default function ScanningScreen({ navigation }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    spinLoop.start();

    Animated.sequence([
      Animated.timing(bar, { toValue: 0.78, duration: SCAN_DURATION_MS * 0.6, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.timing(bar, { toValue: 0.96, duration: SCAN_DURATION_MS * 0.4, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start();

    const t = setTimeout(() => navigation.replace('Disclaimer'), SCAN_DURATION_MS);
    return () => {
      clearTimeout(t);
      spinLoop.stop();
    };
  }, [navigation, spin, bar]);

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
