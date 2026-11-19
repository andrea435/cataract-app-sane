import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { formatScannedAt } from '../../data/format';
import { RootStackParamList } from '../../navigation/types';
import { PendingChip, SegmentedControl, StatusChip } from '../../components/ui';
import type { ScanRow } from '../../data/types';

type Filter = 'all' | 'flagged' | 'referred' | 'clear';

const FILTERS: { value: Filter; label: string; test: (row: ScanRow) => boolean }[] = [
  { value: 'all', label: 'All', test: () => true },
  { value: 'flagged', label: 'Flagged', test: row => row.detected },
  { value: 'referred', label: 'Referred', test: row => !!row.patient?.referral_status },
  { value: 'clear', label: 'Clear', test: row => !row.detected },
];

export default function HistoryTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { history, viewHistoryItem } = useScreening();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Search by name or patient ID, so a worker can find a returning patient quickly.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find(f => f.value === filter)!.test;
    return history.filter(
      row => test(row) && (!q || row.patient_name.toLowerCase().includes(q) || (row.patient_id ?? '').toLowerCase().includes(q))
    );
  }, [history, query, filter]);

  const openItem = (row: (typeof history)[number]) => {
    viewHistoryItem(row);
    navigation.navigate('Result');
  };

  return (
    <View style={styles.padded}>
      <Text style={styles.title}>Scan history</Text>
      {history.length > 0 && (
        <View style={styles.tools}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or patient ID"
            placeholderTextColor={colors.textSubtle}
            style={styles.search}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          <SegmentedControl
            options={FILTERS.map(f => ({ value: f.value, label: f.label }))}
            value={filter}
            onChange={setFilter}
          />
        </View>
      )}
      <View style={{ gap: 10 }}>
        {shown.map(item => (
          <Pressable key={item.id} style={styles.row} onPress={() => openItem(item)}>
            <View>
              <Text style={styles.rowName}>{item.patient_name}</Text>
              <Text style={styles.rowMeta}>
                {formatScannedAt(item.scanned_at)} · {item.eye_label}
              </Text>
              {item.pending ? (
                <View style={{ marginTop: 6 }}>
                  <PendingChip />
                </View>
              ) : (
                item.patient?.referral_status && (
                  <View style={{ marginTop: 6 }}>
                    <StatusChip status={item.patient.referral_status} />
                  </View>
                )
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.pill, { backgroundColor: item.detected ? colors.dangerBg : colors.successBg }]}>
                <Text style={[styles.pillText, { color: item.detected ? colors.danger : colors.success }]}>
                  {item.detected ? 'Cataract detected' : 'No cataract detected'}
                </Text>
              </View>
              <Text style={styles.confidence}>{item.probability}% conf.</Text>
            </View>
          </Pressable>
        ))}
        {history.length === 0 && <Text style={styles.empty}>No screenings yet.</Text>}
        {history.length > 0 && shown.length === 0 && <Text style={styles.empty}>No screenings match.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  title: { fontSize: 21, fontWeight: '700', marginBottom: 20, color: colors.ink },
  tools: { gap: 10, marginBottom: 16 },
  search: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 14.5,
    color: colors.ink,
    fontFamily: 'IBMPlexSans_400Regular',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.textSubtle, marginTop: 3 },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  confidence: { fontSize: 11, color: colors.textSubtle, marginTop: 4 },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
