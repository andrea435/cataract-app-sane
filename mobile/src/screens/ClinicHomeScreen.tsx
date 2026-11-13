import React, { useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { Banner, EmptyState, SegmentedControl, StatusChip } from '../components/ui';
import { ChevronRightIcon } from '../components/icons';
import { ReferralStatus, statusFields } from '../data/types';
import { formatShortDate } from '../data/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicHome'>;
type Filter = ReferralStatus | 'all';

export default function ClinicHomeScreen({ navigation }: Props) {
  const { session, clinics, referrals, loading, loadError, refreshAll, signOut } = useScreening();
  const [filter, setFilter] = useState<Filter>('referred');
  const [refreshing, setRefreshing] = useState(false);

  const clinicId = session.role === 'clinic' ? session.clinicId : null;
  const clinic = clinics.find(c => c.id === clinicId);
  const mine = referrals.filter(r => r.clinic_id === clinicId);
  const count = (s: ReferralStatus) => mine.filter(r => r.status === s).length;
  const shown = filter === 'all' ? mine : mine.filter(r => r.status === filter);

  const leave = () => {
    signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  // The clinic was removed (or this phone's session is stale): go back to the start.
  useEffect(() => {
    if (!loading && !loadError && (!clinicId || !clinic)) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadError, clinicId, clinic]);

  const confirmSignOut = () =>
    Alert.alert('Sign out of clinic view?', 'You will need the access code to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: leave },
    ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const emptyText: Record<Filter, string> = {
    referred: 'No patients waiting. New referrals from health workers appear here automatically.',
    attended: 'Patients you mark as attended appear here until they are treated.',
    treated: 'Patients you mark as treated appear here.',
    all: 'No patients have been referred to this clinic yet.',
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Clinic view</Text>
            <Text style={styles.clinicName}>{clinic?.name ?? ' '}</Text>
          </View>
          <Pressable onPress={confirmSignOut} hitSlop={8} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        {loadError && <Banner text="Couldn't refresh referrals. Showing what was last loaded." actionLabel="Retry" onAction={refreshAll} />}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.brandDark }]}>{count('referred')}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{count('attended')}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.successDark }]}>{count('treated')}</Text>
            <Text style={styles.statLabel}>Treated</Text>
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <SegmentedControl<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'referred', label: 'Waiting' },
              { value: 'attended', label: 'Attended' },
              { value: 'treated', label: 'Treated' },
              { value: 'all', label: 'All' },
            ]}
          />
        </View>

        <View style={{ gap: 10 }}>
          {shown.map(r => {
            const result = r.scan ? statusFields(r.scan.probability, colors) : null;
            return (
              <Pressable key={r.id} style={styles.card} onPress={() => navigation.navigate('ClinicReferral', { referralId: r.id })}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patient}>{r.patient?.name ?? 'Patient'}</Text>
                    <Text style={styles.meta}>
                      {[r.patient?.external_id, r.scan?.eye_label].filter(Boolean).join(' · ') || 'No patient ID'}
                    </Text>
                  </View>
                  {filter === 'all' ? <StatusChip status={r.status} /> : <ChevronRightIcon />}
                </View>
                {result && r.scan && (
                  <View style={[styles.resultPill, { backgroundColor: result.statusBg }]}>
                    <Text style={[styles.resultPillText, { color: result.statusColor }]}>
                      {r.scan.probability}% · {result.severity ? `${result.severity} cataract` : 'No cataract detected'}
                    </Text>
                  </View>
                )}
                {!!r.worker_note && (
                  <Text style={styles.note} numberOfLines={2}>
                    “{r.worker_note}”
                  </Text>
                )}
                <Text style={styles.footer}>
                  Referred by {r.worker_name} · {formatShortDate(r.created_at)}
                </Text>
              </Pressable>
            );
          })}
          {shown.length === 0 && !loading && <EmptyState title="Nothing here" body={emptyText[filter]} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { padding: 24, paddingTop: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: '600', color: colors.brand, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  clinicName: { fontSize: 21, fontWeight: '700', color: colors.ink },
  signOut: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  signOutText: { fontSize: 12, fontWeight: '600', color: colors.textMuted2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  card: { padding: 14, borderRadius: 14, backgroundColor: colors.surfaceMuted, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patient: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  resultPill: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14 },
  resultPillText: { fontSize: 11.5, fontWeight: '700' },
  note: { fontSize: 12.5, color: colors.textBody, lineHeight: 18 },
  footer: { fontSize: 11.5, color: colors.textSubtle },
});
