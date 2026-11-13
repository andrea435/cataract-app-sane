import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { ScreeningProvider, useScreening } from './src/state/ScreeningContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
import { AlertData, listenForAlertTaps, navigationRef, setupAlerts } from './src/lib/alerts';

SplashScreen.preventAutoHideAsync().catch(() => {});
setupAlerts();

export default function App() {
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ScreeningProvider>
        <AppShell />
      </ScreeningProvider>
    </SafeAreaProvider>
  );
}

// Keeps the splash screen up until we know whether someone is already signed in, so the
// app opens straight onto the right screen instead of flashing the sign-in screen.
function AppShell() {
  const screening = useScreening();
  const { authReady } = screening;
  const latest = useRef(screening);
  latest.current = screening;

  // Tapping a referral alert opens that referral.
  useEffect(
    () =>
      listenForAlertTaps(({ referralId }: AlertData) => {
        const { profile, referrals, history, viewHistoryItem, setActiveTab } = latest.current;
        if (!profile || !navigationRef.isReady()) return;
        if (profile.role === 'clinic') {
          navigationRef.navigate('ClinicReferral', { referralId });
          return;
        }
        const scanId = referrals.find(r => r.id === referralId)?.scan_id;
        const scan = scanId ? history.find(h => h.id === scanId) : undefined;
        if (scan) {
          viewHistoryItem(scan);
          navigationRef.navigate('Result');
        } else {
          setActiveTab('clinics');
          navigationRef.navigate('Main');
        }
      }),
    []
  );

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!authReady) return null;

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style="dark" />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
});
