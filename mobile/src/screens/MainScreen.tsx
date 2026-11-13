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
import { Banner, SyncBanner } from '../components/ui';
import { CloudIcon } from '../components/icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

export default function MainScreen({ navigation }: Props) {
  const { activeTab, setActiveTab, loadError, refreshAll, sync, syncNow } = useScreening();
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
          {loadError ? (
            <View style={styles.banner}>
              <Banner
                tone="warning"
                icon={<CloudIcon size={18} color={colors.warning} />}
                text={
                  sync.waiting > 0
                    ? `No signal. ${sync.waiting} item${sync.waiting === 1 ? '' : 's'} saved on this phone will upload when signal returns.`
                    : 'No signal. You can keep screening: new screenings are saved on this phone and upload when signal returns.'
                }
                actionLabel="Retry"
                onAction={refreshAll}
              />
            </View>
          ) : sync.waiting > 0 ? (
            <View style={styles.banner}>
              <SyncBanner {...sync} onSync={syncNow} />
            </View>
          ) : null}
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
