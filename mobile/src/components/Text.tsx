import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

// The design pulls IBM Plex Sans at weights 400/500/600/700. Expo Google Fonts loads each
// weight as its own family name, so we resolve `fontWeight` in the passed style to the right
// loaded family here rather than repeating this everywhere a heading or button label is styled.
const FAMILY_BY_WEIGHT: Record<string, string> = {
  '400': 'IBMPlexSans_400Regular',
  normal: 'IBMPlexSans_400Regular',
  '500': 'IBMPlexSans_500Medium',
  '600': 'IBMPlexSans_600SemiBold',
  '700': 'IBMPlexSans_700Bold',
  bold: 'IBMPlexSans_700Bold',
};

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) || {};
  const weightKey = flat.fontWeight ? String(flat.fontWeight) : '400';
  const fontFamily = FAMILY_BY_WEIGHT[weightKey] ?? FAMILY_BY_WEIGHT['400'];
  return <RNText {...rest} style={[{ fontFamily }, style]} />;
}
