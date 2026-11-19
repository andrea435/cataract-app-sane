import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { computeStats } from '../../data/stats';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

import { initialsOf } from '../../data/types';
import { followUpDays } from '../../data/followUp';
import { PRIVACY_CONTACT } from '../../data/content';

export default function ProfileTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { history, settings, profile, accounts, toggleNotifications, signOut, sync, syncNow } = useScreening();
  const stats = computeStats(history);
  const workerName = profile?.full_name ?? '';
  const initials = initialsOf(workerName);
  const region = profile?.region;
  const notifOn = profile?.notifications_enabled ?? true;
  const workerCount = accounts.filter(a => a.role === 'worker').length;

  const confirmSignOut = () =>
    Alert.alert(
      'Log out?',
      sync.waiting > 0
        ? `${sync.waiting} item${sync.waiting === 1 ? " hasn't" : "s haven't"} uploaded yet. They stay saved on this phone and upload after you sign in again. You need signal to sign in.`
        : 'You will need your email and password to sign in again.',
      [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
      ]
    );

  type Row = { label: string; value?: string; isToggle?: boolean; onPress?: () => void; danger?: boolean };
  // Grouped so the list reads in sections, like a phone's own settings. Every row with an
  // arrow opens something.
  const sections: { title: string; rows: Row[] }[] = [
    {
      title: 'Patients & team',
      rows: [
        { label: 'Reports', onPress: () => navigation.navigate('Reports') },
        { label: 'Follow-up reminders', value: `After ${followUpDays(settings)} days`, onPress: () => navigation.navigate('FollowUps') },
        { label: 'Health workers', value: workerCount ? String(workerCount) : undefined, onPress: () => navigation.navigate('Team') },
      ],
    },
    {
      title: 'This phone',
      rows: [
        {
          label: 'Sync data',
          value: sync.syncing ? 'Uploading…' : sync.waiting > 0 ? `${sync.waiting} waiting` : 'Up to date',
          onPress: syncNow,
        },
        { label: 'Notifications', isToggle: true },
      ],
    },
    {
      title: 'About',
      rows: [
        { label: 'About the AI model', value: settings?.ai_model_version ?? 'VGG19', onPress: () => navigation.navigate('AboutModel') },
        { label: 'Privacy notice', onPress: () => navigation.navigate('PrivacyNotice') },
        {
          label: 'Help & support',
          value: `Call ${PRIVACY_CONTACT.organisation}`,
          onPress: () => Linking.openURL(`tel:${PRIVACY_CONTACT.phone.replace(/\s/g, '')}`),
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        { label: 'Change password', onPress: () => navigation.navigate('ChangePassword') },
        { label: 'Log out', onPress: confirmSignOut, danger: true },
      ],
    },
  ];

  return (
    <View style={styles.padded}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.name}>{workerName}</Text>
          <Text style={styles.role}>
            {profile?.is_admin ? 'Health worker · Admin' : 'Community Health Worker'}
            {region ? ` · ${region}` : ''}
          </Text>
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

      {sections.map(section => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.rows.map((row, i) => (
            <Pressable
              key={row.label}
              style={[styles.settingRow, i === section.rows.length - 1 && { borderBottomWidth: 0 }]}
              onPress={row.onPress}
              disabled={!row.onPress}
            >
              <Text style={[styles.settingLabel, row.danger && { color: colors.danger }]}>{row.label}</Text>
              {row.isToggle ? (
                <Pressable onPress={toggleNotifications} style={[styles.toggle, { backgroundColor: notifOn ? colors.brand : colors.border }]}>
                  <View style={[styles.toggleKnob, { left: notifOn ? 19 : 2 }]} />
                </Pressable>
              ) : (
                <Text style={styles.settingValue}>{row.danger ? '' : row.value ? `${row.value} ›` : '›'}</Text>
              )}
            </Pressable>
          ))}
        </View>
      ))}
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
  section: { backgroundColor: colors.surfaceMuted, borderRadius: 14, paddingHorizontal: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 11.5, fontWeight: '600', color: colors.textSubtle, paddingTop: 12, letterSpacing: 0.3 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
