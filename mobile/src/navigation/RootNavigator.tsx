import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainScreen from '../screens/MainScreen';
import PatientInfoScreen from '../screens/PatientInfoScreen';
import CaptureScreen from '../screens/CaptureScreen';
import ScanningScreen from '../screens/ScanningScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';
import ResultScreen from '../screens/ResultScreen';
import RecommendScreen from '../screens/RecommendScreen';
import ClinicFormScreen from '../screens/ClinicFormScreen';
import ReferScreen from '../screens/ReferScreen';
import ClinicSignInScreen from '../screens/ClinicSignInScreen';
import ClinicHomeScreen from '../screens/ClinicHomeScreen';
import ClinicReferralScreen from '../screens/ClinicReferralScreen';
import { useScreening } from '../state/ScreeningContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // A phone signed in as a clinic opens straight into the clinic view.
  const { session } = useScreening();
  return (
    <Stack.Navigator initialRouteName={session.role === 'clinic' ? 'ClinicHome' : 'Onboarding'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="PatientInfo" component={PatientInfoScreen} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Scanning" component={ScanningScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Recommend" component={RecommendScreen} />
      <Stack.Screen name="ClinicForm" component={ClinicFormScreen} />
      <Stack.Screen name="Refer" component={ReferScreen} />
      <Stack.Screen name="ClinicSignIn" component={ClinicSignInScreen} />
      <Stack.Screen name="ClinicHome" component={ClinicHomeScreen} />
      <Stack.Screen name="ClinicReferral" component={ClinicReferralScreen} />
    </Stack.Navigator>
  );
}
