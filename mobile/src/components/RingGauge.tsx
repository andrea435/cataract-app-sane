import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './Text';
import { colors } from '../theme/colors';

// Same proportions as the design's 140-unit ring: 12-wide stroke.
const STROKE_RATIO = 12 / 140;

interface RingGaugeProps {
  probability: number;
  color: string;
  size?: number;
}

/**
 * The confidence ring. The percentage is laid out by React Native in a box the exact size of
 * the ring, centred both ways, instead of as SVG text: SVG text sits on a baseline, so it
 * drifts off centre depending on the font and on whether it reads "0%", "20%" or "100%".
 */
export function RingGauge({ probability, color, size = 152 }: RingGaugeProps) {
  const value = Math.max(0, Math.min(100, Math.round(probability)));
  const stroke = size * STROKE_RATIO;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - value / 100);
  // Scale with the ring, and step down for "100%" so it stays well inside the track.
  const pctSize = size * (value === 100 ? 0.17 : 0.2);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.ringTrack} strokeWidth={stroke} />
        {/* At 0% a round line cap would still draw a dot at the top, so draw no arc at all. */}
        {value > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap={value === 100 ? 'butt' : 'round'}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={[styles.pct, { fontSize: pctSize, lineHeight: pctSize * 1.15 }]}>{value}%</Text>
        <Text style={[styles.label, { fontSize: Math.max(10, size * 0.072) }]}>confidence</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pct: { fontWeight: '700', color: colors.ink, textAlign: 'center', includeFontPadding: false },
  label: { color: colors.textMuted, textAlign: 'center', marginTop: 1, includeFontPadding: false },
});
