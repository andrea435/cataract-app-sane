import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { computeStats } from '../../data/stats';
import { formatScannedAt, greetingFor } from '../../data/format';
import { PrimaryButton } from '../../components/Buttons';
import { CameraIcon, ChevronRightIcon } from '../../components/icons';
import { daysLabel, dueFollowUps, followUpDays } from '../../data/followUp';
import { RootStackParamList } from '../../navigation/types';
import { PendingChip } from '../../components/ui';

export default function ScanTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { history, profile, referrals, settings, resetDraft, viewHistoryItem } = useScreening();
  const days = followUpDays(settings);
  const due = dueFollowUps(referrals, days).length;
  const stats = computeStats(history);
  const recent = history.slice(0, 3);

  const startScreening = () => {
    resetDraft();
    navigation.navigate('PatientInfo');
  };

  const openItem = (row: (typeof history)[number]) => {
    viewHistoryItem(row);
    navigation.navigate('Result');
  };

  return (
    <View style={styles.padded}>
      <Text style={styles.greeting}>{greetingFor()}</Text>
      <Text style={styles.workerName}>{profile?.full_name ?? ''}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.today}</Text>
          <Text style={styles.statLabel}>Screened today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.flagged}</Text>
          <Text style={styles.statLabel}>Flagged for referral</Text>
        </View>
      </View>

      <PrimaryButton big label="Start new screening" onPress={startScreening} icon={<CameraIcon />} />

      {due > 0 && (
        <Pressable style={styles.followUp} onPress={() => navigation.navigate('FollowUps')}>
          <View style={styles.followUpBadge}>
            <Text style={styles.followUpBadgeText}>{due}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.followUpTitle}>
              {due === 1 ? '1 follow-up due' : `${due} follow-ups due`}
            </Text>
            <Text style={styles.followUpBody}>Referred patients not seen at the clinic after {daysLabel(days)}</Text>
          </View>
          <ChevronRightIcon color={colors.danger} />
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Recent activity</Text>
      <View style={{ gap: 10 }}>
        {recent.map(item => (
          <Pressable key={item.id} style={styles.row} onPress={() => openItem(item)}>
            <View>
              <Text style={styles.rowName}>{item.patient_name}</Text>
              <Text style={styles.rowMeta}>
                {formatScannedAt(item.scanned_at)} · {item.eye_label}
              </Text>
              {item.pending && (
                <View style={{ marginTop: 6 }}>
                  <PendingChip />
                </View>
              )}
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: item.detected ? colors.dangerBg : colors.successBg },
              ]}
            >
              <Text style={[styles.pillText, { color: item.detected ? colors.danger : colors.success }]}>
                {item.probability}%
              </Text>
            </View>
          </Pressable>
        ))}
        {recent.length === 0 && <Text style={styles.empty}>No screenings yet.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  greeting: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  workerName: { fontSize: 21, fontWeight: '700', marginBottom: 22, color: colors.ink },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  statCard: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 16 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  followUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.dangerBg,
  },
  followUpBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  followUpBadgeText: { fontSize: 13.5, fontWeight: '700', color: colors.white },
  followUpTitle: { fontSize: 14, fontWeight: '700', color: colors.danger },
  followUpBody: { fontSize: 12, color: colors.textBody, marginTop: 1 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textLabel, marginTop: 26, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  rowName: { fontSize: 13.5, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 11.5, color: colors.textSubtle, marginTop: 2 },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
