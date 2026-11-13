import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../components/Text';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { RootStackParamList } from '../../navigation/types';
import { EmptyState, SegmentedControl, StatusChip } from '../../components/ui';
import { ChevronRightIcon, PlusIcon } from '../../components/icons';
import { formatShortDate } from '../../data/format';

type View_ = 'clinics' | 'referrals';

export default function ClinicsTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { clinics, referrals, history, viewHistoryItem } = useScreening();
  const [view, setView] = useState<View_>('clinics');

  const openCount = (clinicId: string) => referrals.filter(r => r.clinic_id === clinicId && r.status !== 'treated').length;

  const openReferral = (scanId: string | null) => {
    const scan = scanId ? history.find(h => h.id === scanId) : undefined;
    if (!scan) return;
    viewHistoryItem(scan);
    navigation.navigate('Result');
  };

  return (
    <View style={styles.padded}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Referral clinics</Text>
          <Text style={styles.subtitle}>Facilities for confirmed diagnosis and treatment.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('ClinicForm')} accessibilityLabel="Add clinic">
          <PlusIcon size={14} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <View style={{ marginBottom: 16 }}>
        <SegmentedControl<View_>
          value={view}
          onChange={setView}
          options={[
            { value: 'clinics', label: 'Clinics', count: clinics.length },
            { value: 'referrals', label: 'Referrals sent', count: referrals.length },
          ]}
        />
      </View>

      {view === 'clinics' && (
        <View style={{ gap: 12 }}>
          {clinics.map(clinic => {
            const open = openCount(clinic.id);
            return (
              <Pressable key={clinic.id} style={styles.card} onPress={() => navigation.navigate('ClinicForm', { clinicId: clinic.id })}>
                <View style={styles.cardHeader}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  {!!clinic.distance && <Text style={styles.distance}>{clinic.distance}</Text>}
                </View>
                {!!clinic.address && <Text style={styles.address}>{clinic.address}</Text>}
                {!!clinic.phone && <Text style={styles.phone}>{clinic.phone}</Text>}
                <View style={styles.cardFooter}>
                  <Text style={[styles.openCount, open > 0 && { color: colors.brandDark }]}>
                    {open === 0 ? 'No open referrals' : `${open} open referral${open === 1 ? '' : 's'}`}
                  </Text>
                  <Text style={styles.edit}>Edit ›</Text>
                </View>
              </Pressable>
            );
          })}
          {clinics.length === 0 && (
            <EmptyState title="No clinics yet" body="Add the clinics and hospitals you refer patients to. Each one gets an access code for its own view.">
              <Pressable style={styles.addBtn} onPress={() => navigation.navigate('ClinicForm')}>
                <PlusIcon size={14} />
                <Text style={styles.addBtnText}>Add clinic</Text>
              </Pressable>
            </EmptyState>
          )}
        </View>
      )}

      {view === 'referrals' && (
        <View style={{ gap: 10 }}>
          {referrals.map(r => (
            <Pressable key={r.id} style={styles.row} onPress={() => openReferral(r.scan_id)} disabled={!r.scan_id}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.rowName}>{r.patient?.name ?? 'Patient'}</Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {r.clinic?.name ?? 'Clinic'} · {formatShortDate(r.created_at)}
                </Text>
              </View>
              <StatusChip status={r.status} />
              {!!r.scan_id && <ChevronRightIcon />}
            </Pressable>
          ))}
          {referrals.length === 0 && (
            <EmptyState
              title="No referrals yet"
              body="When a screening flags a cataract, choose “Refer to a clinic” on the result to send the patient here."
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  title: { fontSize: 21, fontWeight: '700', marginBottom: 4, color: colors.ink },
  subtitle: { fontSize: 13, color: colors.textMuted },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 2,
  },
  addBtnText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  card: { padding: 16, borderRadius: 14, backgroundColor: colors.surfaceMuted, gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  clinicName: { fontSize: 14.5, fontWeight: '700', color: colors.ink, flex: 1 },
  distance: { fontSize: 12, color: colors.textMuted },
  address: { fontSize: 12.5, color: colors.textMuted },
  phone: { fontSize: 12.5, color: colors.textMuted },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  openCount: { fontSize: 12, fontWeight: '600', color: colors.textSubtle },
  edit: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.textSubtle },
});
