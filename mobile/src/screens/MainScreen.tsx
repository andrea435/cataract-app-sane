import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { useScreening } from '../state/ScreeningContext';
import BottomTabBar from './main/BottomTabBar';
import ScanTab from './main/ScanTab';
import HistoryTab from './main/HistoryTab';
import ClinicsTab from './main/ClinicsTab';
import ProfileTab from './main/ProfileTab';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainScreen({ navigation }: Props) {
  const { activeTab, setActiveTab } = useScreening();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScrollView>
          {activeTab === 'scan' && <ScanTab navigation={navigation} />}
          {activeTab === 'history' && <HistoryTab navigation={navigation} />}
          {activeTab === 'clinics' && <ClinicsTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </ScrollView>
      </View>
      <BottomTabBar active={activeTab} onSelect={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cardBg,
  },
  content: {
    flex: 1,
  },
});
