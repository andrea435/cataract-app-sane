import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import { BackLink, PrimaryButton } from '../components/Buttons';
import { Banner, Field } from '../components/ui';
import { AccountRow } from '../components/AccountRow';
import { PlusIcon } from '../components/icons';
import { ProfileRow } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicForm'>;

export default function ClinicFormScreen({ navigation, route }: Props) {
  const { clinics, referrals, accounts, addClinic, updateClinic, deleteClinic, removeAccount } = useScreening();
  const existing = route.params?.clinicId ? clinics.find(c => c.id === route.params?.clinicId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [distance, setDistance] = useState(existing?.distance ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const nameMissing = !name.trim();
  const referralCount = existing ? referrals.filter(r => r.clinic_id === existing.id).length : 0;
  const logins = existing ? accounts.filter(a => a.clinic_id === existing.id) : [];

  const save = async () => {
    setTouched(true);
    if (nameMissing) return;
    setBusy(true);
    setError(null);
    const input = {
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      distance: distance.trim() || null,
    };
    const res = existing ? await updateClinic(existing.id, input) : await addClinic(input);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (!existing && 'value' in res && res.value) {
      // Straight on to the new clinic's page, where its staff logins are added.
      navigation.replace('ClinicForm', { clinicId: (res.value as { id: string }).id });
    } else {
      navigation.goBack();
    }
  };

  const confirmRemoveLogin = (a: ProfileRow) =>
    Alert.alert(`Remove ${a.full_name}'s login?`, 'They will no longer be able to see this clinic’s referrals.', [
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

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Remove clinic?', `${existing.name} will no longer be offered for referrals.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const res = await deleteClinic(existing.id);
          setBusy(false);
          if (!res.ok) setError(res.error);
          else navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <BackLink label="Clinics" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>{isEdit ? 'Edit clinic' : 'Add clinic'}</Text>
          <Text style={styles.subtitle}>
            {isEdit ? 'Update the details health workers see when referring.' : 'Add a facility you can refer patients to.'}
          </Text>

          {error && <Banner text={error} />}

          <Field
            label="Clinic name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kisumu Eye Unit"
            error={touched && nameMissing ? 'Enter the clinic name.' : undefined}
            autoCapitalize="words"
          />
          <Field label="Address (optional)" value={address} onChangeText={setAddress} placeholder="e.g. Oginga Odinga St, Kisumu" />
          <Field label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. +254 57 202 0000" keyboardType="phone-pad" />
          <Field label="Distance (optional)" value={distance} onChangeText={setDistance} placeholder="e.g. 2.4 km" />

          {existing ? (
            <View style={styles.loginsSection}>
              <View style={styles.loginsHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loginsTitle}>Clinic logins</Text>
                  <Text style={styles.loginsHint}>Staff with a login see only the patients referred to this clinic, and mark them attended and treated.</Text>
                </View>
                <Pressable style={styles.addLogin} onPress={() => navigation.navigate('AddAccount', { kind: 'clinic', clinicId: existing.id })}>
                  <PlusIcon size={13} color={colors.brand} />
                  <Text style={styles.addLoginText}>Add</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                {logins.map(a => (
                  <AccountRow key={a.id} account={a} onRemove={() => confirmRemoveLogin(a)} />
                ))}
                {logins.length === 0 && <Text style={styles.noLogins}>No logins yet. Add one so the clinic can see its referrals.</Text>}
              </View>
            </View>
          ) : (
            <Text style={styles.loginsHint}>After you add the clinic, you can create logins for its staff.</Text>
          )}

          {isEdit && (
            <Pressable onPress={confirmDelete} disabled={busy} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>Remove clinic</Text>
              {referralCount > 0 && <Text style={styles.deleteHint}>Has {referralCount} referral{referralCount === 1 ? '' : 's'}, so it can't be removed.</Text>}
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={isEdit ? 'Save changes' : 'Add clinic'} onPress={save} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 22 },
  loginsSection: { marginTop: 8, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.divider },
  loginsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  loginsTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  loginsHint: { fontSize: 12, lineHeight: 17, color: colors.textSubtle },
  addLogin: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: colors.brand },
  addLoginText: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  noLogins: { fontSize: 12.5, color: colors.textMuted, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  deleteBtn: { alignItems: 'center', paddingVertical: 18, marginTop: 10 },
  deleteText: { fontSize: 13.5, fontWeight: '600', color: colors.danger },
  deleteHint: { fontSize: 11.5, color: colors.textSubtle, marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
