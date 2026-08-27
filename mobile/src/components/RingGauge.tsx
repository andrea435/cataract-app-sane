import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';

const R = 58;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~364.4, matches the source design's hardcoded value

interface RingGaugeProps {
  probability: number;
  color: string;
  size?: number;
}

export function RingGauge({ probability, color, size = 152 }: RingGaugeProps) {
  const dashOffset = CIRCUMFERENCE * (1 - probability / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 140 140">
        <Circle cx={70} cy={70} r={R} fill="none" stroke={colors.ringTrack} strokeWidth={12} />
        <Circle
          cx={70}
          cy={70}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 70 70)"
        />
        <SvgText x={70} y={65} textAnchor="middle" fontSize={30} fontWeight="700" fill={colors.ink}>
          {probability}%
        </SvgText>
        <SvgText x={70} y={85} textAnchor="middle" fontSize={10.5} fill={colors.textMuted}>
          confidence
        </SvgText>
      </Svg>
    </View>
  );
}
