import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink } from '../components/Buttons';
import { EmptyState, SegmentedControl } from '../components/ui';
import { SendIcon } from '../components/icons';
import { PERIODS, Period, buildReport, pct, reportText } from '../data/reports';

type Props = NativeStackScreenProps<RootStackParamList, 'Reports'>;

/** A single-value bar: how much of the whole `value` is (labelled, never colour alone). */
function RateBar({ value, color = colors.brand }: { value: number; color?: string }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(100, value)}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ReportsScreen({ navigation }: Props) {
  const { history, referrals, clinics } = useScreening();
  const [period, setPeriod] = useState<Period>('30');
  const report = buildReport(history, referrals, clinics, period);
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? '';
  const { referred, attended, treated } = report.referrals;

  const share = () => Share.share({ message: reportText(report, period === 'all' ? 'All time' : `Last ${periodLabel}`) });

  // Flagged → referred → attended → treated, each as a share of patients flagged.
  const funnel = [
    { label: 'Flagged', value: report.flagged },
    { label: 'Referred', value: referred },
    { label: 'Attended', value: attended },
    { label: 'Treated', value: treated },
  ];
  const funnelMax = Math.max(1, ...funnel.map(f => f.value));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <BackLink label="Back" onPress={() => navigation.goBack()} />
          <Pressable style={styles.shareBtn} onPress={share} accessibilityLabel="Share report">
            <SendIcon size={14} />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Screenings, referrals and treatment across the whole team.</Text>

        <View style={{ marginBottom: 20 }}>
          <SegmentedControl<Period> value={period} onChange={setPeriod} options={PERIODS} />
        </View>

        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileValue}>{report.screenings}</Text>
            <Text style={styles.tileLabel}>Screenings</Text>
            <Text style={styles.tileSub}>{report.patients} patients</Text>
          </View>
          <View style={styles.tile}>
            <Text style={[styles.tileValue, { color: colors.danger }]}>{report.flagged}</Text>
            <Text style={styles.tileLabel}>Flagged</Text>
            <Text style={styles.tileSub}>{pct(report.flagged, report.screenings)}% of screenings</Text>
          </View>
          <View style={styles.tile}>
            <Text style={[styles.tileValue, { color: colors.brandDark }]}>{referred}</Text>
            <Text style={styles.tileLabel}>Referred</Text>
            <Text style={styles.tileSub}>{attended} attended</Text>
          </View>
          <View style={styles.tile}>
            <Text style={[styles.tileValue, { color: colors.successDark }]}>{pct(treated, referred)}%</Text>
            <Text style={styles.tileLabel}>Treatment rate</Text>
            <Text style={styles.tileSub}>
              {treated} of {referred} treated
            </Text>
          </View>
        </View>

        <Text style={styles.section}>From screening to treatment</Text>
        <View style={styles.card}>
          {funnel.map(f => (
            <View key={f.label} style={styles.funnelRow}>
              <Text style={styles.funnelLabel}>{f.label}</Text>
              <View style={{ flex: 1 }}>
                <RateBar value={(f.value / funnelMax) * 100} />
              </View>
              <Text style={styles.funnelValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>By clinic</Text>
        {report.byClinic.length === 0 ? (
          <EmptyState title="No referrals in this period" />
        ) : (
          <View style={styles.card}>
            {report.byClinic.map((c, i) => (
              <View key={c.id} style={[styles.listRow, i > 0 && styles.listRowBorder]}>
                <View style={styles.listHead}>
                  <Text style={styles.listName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.listRate}>{pct(c.treated, c.referred)}% treated</Text>
                </View>
                <RateBar value={pct(c.treated, c.referred)} color={colors.success} />
                <Text style={styles.listMeta}>
                  {c.referred} referred · {c.attended} attended · {c.treated} treated
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.section}>By health worker</Text>
        {report.byWorker.length === 0 ? (
          <EmptyState title="No screenings in this period" />
        ) : (
          <View style={styles.card}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>Name</Text>
              <Text style={styles.th}>Screens</Text>
              <Text style={styles.th}>Flagged</Text>
              <Text style={styles.th}>Referred</Text>
              <Text style={styles.th}>Treated</Text>
            </View>
            {report.byWorker.map(w => (
              <View key={w.name} style={[styles.tableRow, styles.listRowBorder]}>
                <Text style={[styles.td, styles.tdName]} numberOfLines={1}>
                  {w.name}
                </Text>
                <Text style={styles.td}>{w.screenings}</Text>
                <Text style={styles.td}>{w.flagged}</Text>
                <Text style={styles.td}>{w.referrals}</Text>
                <Text style={styles.td}>{w.treated}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footnote}>
          Screenings and referrals are counted when they were made; attended and treated show where those referrals are now.
          Attended includes patients already treated.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brand, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16 },
  shareText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 18 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14 },
  tileValue: { fontSize: 22, fontWeight: '700', color: colors.ink },
  tileLabel: { fontSize: 12, fontWeight: '600', color: colors.textLabel, marginTop: 2 },
  tileSub: { fontSize: 11.5, color: colors.textSubtle, marginTop: 2 },
  section: { fontSize: 13, fontWeight: '600', color: colors.textLabel, marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14 },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  funnelLabel: { width: 66, fontSize: 12.5, color: colors.textBody },
  funnelValue: { width: 32, textAlign: 'right', fontSize: 13, fontWeight: '700', color: colors.ink },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.trackBg, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  listRow: { paddingVertical: 10, gap: 6 },
  listRowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  listName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: colors.ink },
  listRate: { fontSize: 12.5, fontWeight: '700', color: colors.textStrong },
  listMeta: { fontSize: 11.5, color: colors.textSubtle },
  tableHead: { flexDirection: 'row', paddingBottom: 8 },
  th: { width: 50, fontSize: 11, fontWeight: '600', color: colors.textSubtle, textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  td: { width: 50, fontSize: 13, color: colors.textBody, textAlign: 'right' },
  tdName: { flex: 1, width: undefined, textAlign: 'left', fontSize: 12.5, fontWeight: '600', color: colors.ink },
  footnote: { fontSize: 11.5, color: colors.textSubtle, lineHeight: 17, marginTop: 18 },
});
