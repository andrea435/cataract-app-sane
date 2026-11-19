import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink } from '../components/Buttons';
import { Banner, EmptyState, SegmentedControl } from '../components/ui';
import { CheckIcon, ChevronRightIcon } from '../components/icons';
import { FOLLOW_UP_CHOICES, daysLabel, daysSinceReferral, dueFollowUps, followUpDays } from '../data/followUp';
import { formatShortDate } from '../data/format';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowUps'>;

// Referred patients who haven't reached the clinic after the reminder period.
export default function FollowUpsScreen({ navigation }: Props) {
  const { referrals, clinics, history, settings, updateReferral, setFollowUpDays, viewHistoryItem } = useScreening();
  const days = followUpDays(settings);
  const due = dueFollowUps(referrals, days);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusyId(id);
    setError(null);
    const res = await action();
    setBusyId(null);
    if (!res.ok) setError("Couldn't save. Check your connection and try again.");
  };

  const openScreening = (scanId: string | null) => {
    const scan = scanId ? history.find(h => h.id === scanId) : undefined;
    if (!scan) return;
    viewHistoryItem(scan);
    navigation.navigate('Result');
  };

  const choices = FOLLOW_UP_CHOICES.includes(days) ? FOLLOW_UP_CHOICES : [...FOLLOW_UP_CHOICES, days].sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Follow-ups due</Text>
        <Text style={styles.subtitle}>
          Referred patients the clinic hasn't marked as attended after {daysLabel(days)}. Contact them or the clinic to find out
          why, and help them get there.
        </Text>

        <Text style={styles.label}>Remind me after</Text>
        <View style={{ marginBottom: 20 }}>
          <SegmentedControl<string>
            value={String(days)}
            onChange={v => run('settings', () => setFollowUpDays(Number(v)))}
            options={choices.map(d => ({ value: String(d), label: `${d} days` }))}
          />
        </View>

        {error && <Banner text={error} />}

        <View style={{ gap: 12 }}>
          {due.map(r => {
            const clinic = clinics.find(c => c.id === r.clinic_id);
            const waited = daysSinceReferral(r);
            const busy = busyId === r.id;
            return (
              <View key={r.id} style={styles.card}>
                <Pressable style={styles.cardTop} onPress={() => openScreening(r.scan_id)} disabled={!r.scan_id}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patient}>{r.patient?.name ?? 'Patient'}</Text>
                    <Text style={styles.meta}>
                      {[r.patient?.external_id, r.clinic?.name ?? clinic?.name].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={styles.waitPill}>
                    <Text style={styles.waitText}>{daysLabel(waited)}</Text>
                  </View>
                  {!!r.scan_id && <ChevronRightIcon />}
                </Pressable>
                <Text style={styles.detail}>
                  Referred {formatShortDate(r.created_at)} by {r.worker_name}
                  {r.followed_up_at ? ` · last followed up ${formatShortDate(r.followed_up_at)}` : ''}
                </Text>
                {/* Call clinic gets its own row so the three buttons don't squeeze on 360-wide phones. */}
                {!!clinic?.phone && (
                  <Pressable
                    style={[styles.action, styles.actionWide]}
                    onPress={() => Linking.openURL(`tel:${clinic.phone?.replace(/\s/g, '')}`)}
                  >
                    <Text style={styles.actionText}>Call clinic · {clinic.phone}</Text>
                  </Pressable>
                )}
                <View style={styles.actions}>
                  <Pressable
                    style={styles.action}
                    disabled={busy}
                    onPress={() => run(r.id, () => updateReferral(r.id, { followed_up_at: new Date().toISOString() }))}
                  >
                    <Text style={styles.actionText}>Followed up</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.action, styles.actionPrimary]}
                    disabled={busy}
                    onPress={() => run(r.id, () => updateReferral(r.id, { status: 'attended' }))}
                  >
                    <CheckIcon size={12} />
                    <Text style={[styles.actionText, { color: colors.white }]}>Attended</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {due.length === 0 && (
            <EmptyState
              title="No follow-ups due"
              body={`Every referred patient has either reached the clinic or was referred less than ${daysLabel(days)} ago.`}
            />
          )}
        </View>

        <Text style={styles.footnote}>
          “Followed up” restarts the {daysLabel(days)} count for that patient. “Attended” records that they reached the clinic,
          if the clinic hasn't done so.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 20, lineHeight: 19 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.textLabelStrong, marginBottom: 8 },
  card: { padding: 14, borderRadius: 14, backgroundColor: colors.surfaceMuted, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patient: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  waitPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, backgroundColor: colors.dangerBg },
  waitText: { fontSize: 11.5, fontWeight: '700', color: colors.danger },
  detail: { fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  action: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWide: { flex: 0, marginTop: 4 },
  actionPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionText: { fontSize: 13.5, fontWeight: '700', color: colors.brandDark },
  footnote: { fontSize: 11.5, color: colors.textSubtle, lineHeight: 17, marginTop: 18 },
});
