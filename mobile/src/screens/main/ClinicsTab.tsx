import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/Text';
import { colors } from '../../theme/colors';
import { useScreening } from '../../state/ScreeningContext';

export default function ClinicsTab() {
  const { clinics, bookClinic } = useScreening();

  return (
    <View style={styles.padded}>
      <Text style={styles.title}>Referral clinics</Text>
      <Text style={styles.subtitle}>Nearby facilities for confirmed diagnosis and treatment.</Text>

      <View style={{ gap: 12 }}>
        {clinics.map(clinic => {
          const booked = !!clinic.booked_at;
          return (
            <View key={clinic.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.clinicName}>{clinic.name}</Text>
                <Text style={styles.distance}>{clinic.distance}</Text>
              </View>
              <Text style={styles.address}>{clinic.address}</Text>
              <Text style={styles.phone}>{clinic.phone}</Text>
              <Pressable
                disabled={booked}
                onPress={() => bookClinic(clinic.id)}
                style={[
                  styles.bookBtn,
                  {
                    borderColor: booked ? colors.successBg : colors.brand,
                    backgroundColor: booked ? colors.successBg : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.bookBtnText, { color: booked ? colors.successDark : colors.brand }]}>
                  {booked ? 'Referral sent' : 'Refer patient'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: { padding: 24, paddingTop: 26, paddingBottom: 20 },
  title: { fontSize: 21, fontWeight: '700', marginBottom: 4, color: colors.ink },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  clinicName: { fontSize: 14.5, fontWeight: '700', color: colors.ink },
  distance: { fontSize: 12, color: colors.textMuted },
  address: { fontSize: 12.5, color: colors.textMuted },
  phone: { fontSize: 12.5, color: colors.textMuted, marginBottom: 8 },
  bookBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  bookBtnText: { fontSize: 12.5, fontWeight: '700' },
});
