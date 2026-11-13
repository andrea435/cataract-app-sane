import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink } from '../components/Buttons';
import { Banner } from '../components/ui';
import { AccountRow } from '../components/AccountRow';
import { PlusIcon } from '../components/icons';
import { ProfileRow } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Team'>;

export default function TeamScreen({ navigation }: Props) {
  const { accounts, profile, removeAccount } = useScreening();
  const [error, setError] = useState<string | null>(null);
  const workers = accounts.filter(a => a.role === 'worker');
  const isAdmin = !!profile?.is_admin;

  const confirmRemove = (a: ProfileRow) =>
    Alert.alert(`Remove ${a.full_name}?`, 'They will be signed out and can no longer use the app. Their past screenings are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const res = await removeAccount(a.id);
          setError(res.ok ? null : res.error);
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Profile" onPress={() => navigation.goBack()} />
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Health workers</Text>
            <Text style={styles.subtitle}>
              {isAdmin ? 'Everyone who can screen patients and send referrals.' : 'Ask an admin to add or remove health workers.'}
            </Text>
          </View>
          {isAdmin && (
            <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddAccount', { kind: 'worker' })}>
              <PlusIcon size={14} />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          )}
        </View>

        {error && <Banner text={error} />}

        <View style={{ gap: 8 }}>
          {workers.map(a => (
            <AccountRow key={a.id} account={a} isYou={a.id === profile?.id} onRemove={isAdmin ? () => confirmRemove(a) : undefined} />
          ))}
        </View>
        <Text style={styles.footnote}>Clinic staff logins are managed on each clinic’s page in the Clinics tab.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.textMuted },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brand, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, marginTop: 2 },
  addBtnText: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  footnote: { fontSize: 12, lineHeight: 17, color: colors.textSubtle, marginTop: 16 },
});
