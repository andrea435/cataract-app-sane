import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { Banner } from '../components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainScreen({ navigation }: Props) {
  const { activeTab, setActiveTab, loadError, refreshAll } = useScreening();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}>
          {loadError && (
            <View style={styles.banner}>
              <Banner text="Couldn't reach the server. Pull down or tap Retry to try again." actionLabel="Retry" onAction={refreshAll} />
            </View>
          )}
          {activeTab === 'scan' && <ScanTab navigation={navigation} />}
          {activeTab === 'history' && <HistoryTab navigation={navigation} />}
          {activeTab === 'clinics' && <ClinicsTab navigation={navigation} />}
          {activeTab === 'profile' && <ProfileTab navigation={navigation} />}
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
  banner: {
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: -16,
  },
});
