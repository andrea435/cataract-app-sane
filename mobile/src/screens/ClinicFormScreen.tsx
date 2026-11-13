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
import { randomAccessCode } from '../data/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicForm'>;

export default function ClinicFormScreen({ navigation, route }: Props) {
  const { clinics, referrals, addClinic, updateClinic, deleteClinic } = useScreening();
  const existing = route.params?.clinicId ? clinics.find(c => c.id === route.params?.clinicId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [distance, setDistance] = useState(existing?.distance ?? '');
  const [accessCode, setAccessCode] = useState(existing?.access_code ?? randomAccessCode());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const nameMissing = !name.trim();
  const referralCount = existing ? referrals.filter(r => r.clinic_id === existing.id).length : 0;

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
      access_code: accessCode,
    };
    const res = existing ? await updateClinic(existing.id, input) : await addClinic(input);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigation.goBack();
  };

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

          <View style={styles.codeCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>Clinic access code</Text>
              <Text style={styles.code}>{accessCode.split('').join(' ')}</Text>
              <Text style={styles.codeHint}>Share this with the clinic. Staff enter it to open their clinic view and see referrals sent to them.</Text>
            </View>
            <Pressable onPress={() => setAccessCode(randomAccessCode())} hitSlop={8}>
              <Text style={styles.codeAction}>New code</Text>
            </Pressable>
          </View>

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
  codeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    marginTop: 4,
  },
  codeLabel: { fontSize: 12.5, fontWeight: '600', color: colors.brandDark },
  code: { fontSize: 24, fontWeight: '700', color: colors.ink, letterSpacing: 2, marginVertical: 4 },
  codeHint: { fontSize: 12, color: colors.textMuted2, lineHeight: 17 },
  codeAction: { fontSize: 12.5, fontWeight: '700', color: colors.brand },
  deleteBtn: { alignItems: 'center', paddingVertical: 18, marginTop: 10 },
  deleteText: { fontSize: 13.5, fontWeight: '600', color: colors.danger },
  deleteHint: { fontSize: 11.5, color: colors.textSubtle, marginTop: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
});
