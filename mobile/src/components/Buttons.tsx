import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  big?: boolean;
}

export function PrimaryButton({ label, onPress, disabled, loading, icon, big }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        big && styles.primaryBig,
        disabled && styles.primaryDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.primaryText, big && styles.primaryTextBig]}>{label}</Text>}
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, color = colors.brand }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.outline, { borderColor: color }, pressed && styles.pressed]}>
      <Text style={[styles.outlineText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.back}>
      <Text style={styles.backText}>{'←'} {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryBig: {
    paddingVertical: 18,
    borderRadius: 14,
  },
  primaryDisabled: {
    backgroundColor: colors.disabledBg,
  },
  pressed: {
    opacity: 0.85,
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryTextBig: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  ghost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: colors.textMuted2,
    fontSize: 14.5,
    fontWeight: '600',
  },
  outline: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8,
  },
  backText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
