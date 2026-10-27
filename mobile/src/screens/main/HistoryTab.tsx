import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { formatScannedAt } from '../../data/format';
import { RootStackParamList } from '../../navigation/types';
import { referralLabel } from '../../data/types';

export default function HistoryTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { history, viewHistoryItem } = useScreening();

  const openItem = (row: (typeof history)[number]) => {
    viewHistoryItem(row);
    navigation.navigate('Result');
  };

  return (
    <View style={styles.padded}>
      <Text style={styles.title}>Scan history</Text>
      <View style={{ gap: 10 }}>
        {history.map(item => (
          <Pressable key={item.id} style={styles.row} onPress={() => openItem(item)}>
            <View>
              <Text style={styles.rowName}>{item.patient_name}</Text>
              <Text style={styles.rowMeta}>
                {formatScannedAt(item.scanned_at)} · {item.eye_label}
              </Text>
              {item.patient?.referral_status && <Text style={styles.referral}>{referralLabel(item.patient.referral_status)}</Text>}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  title: { fontSize: 21, fontWeight: '700', marginBottom: 20, color: colors.ink },
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
  referral: { fontSize: 11.5, fontWeight: '600', color: colors.brandDark, marginTop: 3 },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 16 },
  pillText: { fontSize: 11.5, fontWeight: '700' },
  confidence: { fontSize: 11, color: colors.textSubtle, marginTop: 4 },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
