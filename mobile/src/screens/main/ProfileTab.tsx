import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { computeStats } from '../../data/stats';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfileTab() {
  const { history, settings, toggleNotifications } = useScreening();
  const stats = computeStats(history);
  const workerName = settings?.worker_name ?? 'Naomi Achieng';
  const initials = settings?.worker_initials ?? initialsOf(workerName);
  const region = settings?.worker_region ?? 'Kisumu County';
  const notifOn = settings?.notifications_enabled ?? true;

  const rows: { label: string; value?: string; isToggle?: boolean }[] = [
    { label: 'Language', value: 'English' },
    { label: 'Sync data', value: 'Auto' },
    { label: 'Notifications', isToggle: true },
    { label: 'About the AI model', value: settings?.ai_model_version ?? 'v2.3' },
    { label: 'Help & support' },
    { label: 'Log out' },
  ];

  return (
    <View style={styles.padded}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.name}>{workerName}</Text>
          <Text style={styles.role}>Community Health Worker · {region}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total scans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.danger }]}>{stats.flaggedTotal}</Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.week}</Text>
          <Text style={styles.statLabel}>This week</Text>
        </View>
      </View>

      <View>
        {rows.map((row, i) => (
          <View key={i} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{row.label}</Text>
            {row.isToggle ? (
              <Pressable onPress={toggleNotifications} style={[styles.toggle, { backgroundColor: notifOn ? colors.brand : colors.border }]}>
                <View style={[styles.toggleKnob, { left: notifOn ? 19 : 2 }]} />
              </Pressable>
            ) : (
              <Text style={styles.settingValue}>{row.value ? `${row.value} ›` : '›'}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 19, fontWeight: '700', color: colors.brandDark },
  name: { fontSize: 16.5, fontWeight: '700', color: colors.ink },
  role: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 26 },
  statCard: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLabel: { fontSize: 13.5, color: colors.textPrimary },
  settingValue: { fontSize: 13, color: colors.textSubtle2 },
  toggle: { width: 40, height: 23, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.white,
    position: 'absolute',
  },
});
