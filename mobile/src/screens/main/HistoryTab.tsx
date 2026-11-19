import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Text';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';
import { formatScannedAt } from '../../data/format';
import { RootStackParamList } from '../../navigation/types';
import { PendingChip, StatusChip } from '../../components/ui';
import { ArrowRightIcon, EyeIcon } from '../../components/icons';
import type { ScanRow } from '../../data/types';

// Laid out after Sane's "Screening Results Dashboard" mobile frame: a teal hero, clinic tabs,
// a patients-captured card, then one photo card per screening and "See more".

const PAGE = 10;
const ALL = 'all';
const NOT_REFERRED = 'none';

export default function HistoryTab({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Main'> }) {
  const { history, referrals, viewHistoryItem, photoUrlFor } = useScreening();
  const [clinicTab, setClinicTab] = useState<string>(ALL);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  // Which clinic each screening was referred to: by the scan itself, else by the patient.
  const clinicOf = useMemo(() => {
    const byScan = new Map<string, { id: string; name: string }>();
    const byPatient = new Map<string, { id: string; name: string }>();
    for (const r of referrals) {
      if (!r.clinic) continue;
      if (r.scan_id && !byScan.has(r.scan_id)) byScan.set(r.scan_id, r.clinic);
      if (!byPatient.has(r.patient_id)) byPatient.set(r.patient_id, r.clinic);
    }
    return (row: ScanRow) => byScan.get(row.id) ?? (row.patient_record_id ? byPatient.get(row.patient_record_id) : undefined) ?? null;
  }, [referrals]);

  // Screening numbers count up from the first one saved, so "No. 1" stays No. 1.
  const numberOf = useMemo(() => {
    const m = new Map<string, number>();
    history.forEach((row, i) => m.set(row.id, history.length - i));
    return m;
  }, [history]);

  const tabs = useMemo(() => {
    const seen = new Map<string, string>();
    history.forEach(row => {
      const c = clinicOf(row);
      if (c) seen.set(c.id, c.name);
    });
    const list = [{ id: ALL, name: 'All Clinics' }, ...[...seen].map(([id, name]) => ({ id, name }))];
    if (history.some(row => !clinicOf(row))) list.push({ id: NOT_REFERRED, name: 'Not referred' });
    return list;
  }, [history, clinicOf]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter(row => {
      const c = clinicOf(row);
      const inTab = clinicTab === ALL || (clinicTab === NOT_REFERRED ? !c : c?.id === clinicTab);
      const inSearch = !q || row.patient_name.toLowerCase().includes(q) || (row.patient_id ?? '').toLowerCase().includes(q);
      return inTab && inSearch;
    });
  }, [history, clinicTab, query, clinicOf]);

  const patientCount = useMemo(
    () => new Set(filtered.map(row => row.patient_record_id ?? row.patient_name.trim().toLowerCase())).size,
    [filtered]
  );

  const openItem = (row: ScanRow) => {
    viewHistoryItem(row);
    navigation.navigate('Result');
  };

  const pickTab = (id: string) => {
    setClinicTab(id);
    setLimit(PAGE);
  };

  return (
    <View style={styles.padded}>
      <View style={styles.hero}>
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>RESULTS DASHBOARD</Text>
        </View>
        <Text style={styles.heroTitle}>Screening Results</Text>
        <Text style={styles.heroBody}>Every cataract screening saved by your team, newest first.</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map(t => {
          const active = t.id === clinicTab;
          return (
            <Pressable key={t.id} onPress={() => pickTab(t.id)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statCard}>
        <Text style={styles.statValue}>{patientCount}</Text>
        <Text style={styles.statLabel}>
          Patient{patientCount === 1 ? '' : 's'} captured · {filtered.length} screening{filtered.length === 1 ? '' : 's'}
        </Text>
      </View>

      {history.length > 0 && (
        <TextInput
          value={query}
          onChangeText={t => {
            setQuery(t);
            setLimit(PAGE);
          }}
          placeholder="Search by name or patient ID"
          placeholderTextColor={colors.textSubtle}
          style={styles.search}
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      )}

      <View style={{ gap: 14 }}>
        {filtered.slice(0, limit).map(item => {
          const clinic = clinicOf(item);
          const photo = item.local_photo_uri ?? photoUrlFor(item.photo_path);
          return (
            <Pressable key={item.id} style={styles.card} onPress={() => openItem(item)}>
              <View style={styles.cardImage}>
                {photo ? (
                  <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.noPhoto]}>
                    <EyeIcon size={56} color={colors.brandSoftBorder} />
                  </View>
                )}
                <View style={styles.cardPill}>
                  <Text style={styles.cardPillText} numberOfLines={1}>
                    {(clinic?.name ?? 'Not referred').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardLabel}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Screening Result No.{numberOf.get(item.id)}</Text>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.patient_name} · {item.eye_label}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <View style={[styles.outcome, { backgroundColor: item.detected ? colors.dangerBg : colors.successBg }]}>
                        <Text style={[styles.outcomeText, { color: item.detected ? colors.danger : colors.success }]}>
                          {item.detected ? 'Cataract' : 'No cataract'} · {item.probability}%
                        </Text>
                      </View>
                      {item.pending ? (
                        <PendingChip />
                      ) : (
                        item.patient?.referral_status && <StatusChip status={item.patient.referral_status} />
                      )}
                    </View>
                    <Text style={styles.cardDate}>{formatScannedAt(item.scanned_at)}</Text>
                  </View>
                  <View style={styles.arrow}>
                    <ArrowRightIcon size={15} color={colors.ink} />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
        {history.length === 0 && <Text style={styles.empty}>No screenings yet.</Text>}
        {history.length > 0 && filtered.length === 0 && <Text style={styles.empty}>No screenings match.</Text>}
      </View>

      {filtered.length > limit && (
        <Pressable style={styles.more} onPress={() => setLimit(l => l + PAGE)}>
          <Text style={styles.moreText}>See More</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 16, paddingTop: 16, paddingBottom: 24 },

  hero: {
    backgroundColor: colors.heroTeal,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 34,
    alignItems: 'center',
    marginBottom: 18,
  },
  heroPill: { backgroundColor: colors.heroPill, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 16 },
  heroPillText: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.6, color: colors.ink },
  heroTitle: { fontSize: 32, lineHeight: 38, fontWeight: '700', color: colors.heroText, textAlign: 'center', marginBottom: 12 },
  heroBody: { fontSize: 14, lineHeight: 21, color: colors.heroText, textAlign: 'center', maxWidth: 280 },

  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 18,
  },
  tab: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.brand },
  tabText: { fontSize: 14, color: colors.textSubtle },
  tabTextActive: { color: colors.ink, fontWeight: '600' },

  statCard: { backgroundColor: colors.statCardBg, borderRadius: 16, paddingVertical: 22, paddingHorizontal: 20, marginBottom: 14 },
  statValue: { fontSize: 38, lineHeight: 44, fontWeight: '700', color: colors.statTeal },
  statLabel: { fontSize: 13.5, color: colors.textBody, marginTop: 4 },

  search: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    fontSize: 14.5,
    color: colors.ink,
    fontFamily: 'IBMPlexSans_400Regular',
    marginBottom: 14,
  },

  card: { borderRadius: 18, padding: 4, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.white },
  cardImage: { height: 300, borderRadius: 15, overflow: 'hidden', backgroundColor: colors.captureBg, justifyContent: 'space-between' },
  noPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.captureStripeA },
  cardPill: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    margin: 12,
    backgroundColor: colors.cardPill,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  cardPillText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: colors.white },
  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.cardGlass,
  },
  cardTitle: { fontSize: 16, fontWeight: '500', color: colors.ink },
  cardName: { fontSize: 12.5, color: colors.textBody, marginTop: 1 },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  outcome: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  outcomeText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11, color: colors.textSubtle, marginTop: 5 },
  arrow: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },

  more: { marginTop: 16, backgroundColor: colors.statCardBg, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  moreText: { fontSize: 17, fontWeight: '700', color: colors.ink },

  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
});
