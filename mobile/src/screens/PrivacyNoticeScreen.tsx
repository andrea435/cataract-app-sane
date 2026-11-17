import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { BackLink } from '../components/Buttons';
import { CONSENT_VERSION, PRIVACY_NOTICE } from '../data/content';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyNotice'>;

export default function PrivacyNoticeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Privacy notice</Text>
        <Text style={styles.subtitle}>How patients' information is collected, used and protected.</Text>
        {PRIVACY_NOTICE.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.version}>Version {CONSENT_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cardBg },
  content: { paddingHorizontal: 26, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: colors.ink },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginBottom: 22 },
  section: { marginBottom: 18 },
  heading: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  paragraph: { fontSize: 13.5, lineHeight: 22, color: colors.textBody, marginBottom: 8 },
  version: { fontSize: 11.5, color: colors.textSubtle, marginTop: 4 },
});
