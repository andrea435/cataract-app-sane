import React from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Text } from './Text';
import { colors } from '../theme/colors';
import { REFERRAL_STATUSES, ReferralStatus, referralStep } from '../data/types';
import { CheckIcon } from './icons';

// Small shared building blocks for the clinic and referral screens, styled to match the
// existing screens (surfaceMuted cards, 10–14px radii, brand pills).

export const STATUS_STYLE: Record<ReferralStatus, { fg: string; bg: string }> = {
  referred: { fg: colors.brandDark, bg: colors.brandTint },
  attended: { fg: colors.warning, bg: colors.warningBg },
  treated: { fg: colors.successDark, bg: colors.successBg },
};

export function StatusChip({ status }: { status: ReferralStatus }) {
  const s = STATUS_STYLE[status];
  const label = REFERRAL_STATUSES.find(x => x.value === status)?.label ?? status;
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={[styles.chipText, { color: s.fg }]}>{label}</Text>
    </View>
  );
}

/** Referred → Attended → Treated progress. Tapping a step sets it, when `onSelect` is given. */
export function StatusStepper({ status, onSelect }: { status: ReferralStatus; onSelect?: (s: ReferralStatus) => void }) {
  const current = referralStep(status);
  return (
    <View style={styles.stepper}>
      {REFERRAL_STATUSES.map((step, i) => {
        const done = i <= current;
        const isLast = i === REFERRAL_STATUSES.length - 1;
        return (
          <React.Fragment key={step.value}>
            <Pressable
              disabled={!onSelect}
              onPress={() => onSelect?.(step.value)}
              hitSlop={6}
              style={styles.step}
              accessibilityRole={onSelect ? 'button' : undefined}
              accessibilityState={{ selected: i === current }}
            >
              <View style={[styles.stepDot, done ? styles.stepDotDone : styles.stepDotTodo]}>
                {done ? <CheckIcon size={13} /> : <Text style={styles.stepNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step.label}</Text>
            </Pressable>
            {!isLast && <View style={[styles.stepLine, i < current && styles.stepLineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} style={[styles.segmentItem, active && styles.segmentItemActive]} onPress={() => onChange(opt.value)}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {opt.label}
              {opt.count !== undefined ? ` ${opt.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, hint, error, style, ...input }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.textSubtle} style={[styles.input, !!error && styles.inputError, style]} {...input} />
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Banner({ text, actionLabel, onAction, tone = 'danger' }: { text: string; actionLabel?: string; onAction?: () => void; tone?: 'danger' | 'success' }) {
  const fg = tone === 'danger' ? colors.danger : colors.successDark;
  const bg = tone === 'danger' ? colors.dangerBg : colors.successBg;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[styles.bannerText, { color: fg }]}>{text}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.bannerAction, { color: fg }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body && <Text style={styles.emptyBody}>{body}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, alignSelf: 'flex-start' },
  chipText: { fontSize: 11.5, fontWeight: '700' },

  stepper: { flexDirection: 'row', alignItems: 'flex-start' },
  step: { alignItems: 'center', width: 64 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: colors.brand },
  stepDotTodo: { backgroundColor: colors.cardBg, borderWidth: 1.5, borderColor: colors.border },
  stepNum: { fontSize: 11.5, fontWeight: '700', color: colors.textSubtle },
  stepLabel: { fontSize: 11.5, fontWeight: '600', color: colors.textSubtle, marginTop: 6 },
  stepLabelDone: { color: colors.brandDark },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: colors.border, marginTop: 12 },
  stepLineDone: { backgroundColor: colors.brand },

  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 4, gap: 4 },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segmentItemActive: {
    backgroundColor: colors.cardBg,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { fontSize: 12.5, fontWeight: '600', color: colors.textSubtle },
  segmentTextActive: { color: colors.brandDark },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12.5, fontWeight: '600', color: colors.textLabelStrong, marginBottom: 6 },
  input: {
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14.5,
    color: colors.ink,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  inputError: { borderColor: colors.danger },
  fieldHint: { fontSize: 11.5, color: colors.textSubtle, marginTop: 5 },
  fieldError: { fontSize: 11.5, color: colors.danger, marginTop: 5 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 16 },
  bannerText: { flex: 1, fontSize: 12.5, fontWeight: '500', lineHeight: 18 },
  bannerAction: { fontSize: 12.5, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surfaceMuted, gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptyBody: { fontSize: 12.5, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 6 },
});
