import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { BackLink } from '../components/Buttons';
import { ABOUT_MODEL } from '../data/content';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutModel'>;

export default function AboutModelScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>About the AI model</Text>
        <Text style={styles.subtitle}>What the cataract check does, and what it can't do.</Text>
        {ABOUT_MODEL.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>
        ))}
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
});
