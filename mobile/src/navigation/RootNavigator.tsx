import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/SignInScreen';
import SetupScreen from '../screens/SetupScreen';
import MainScreen from '../screens/MainScreen';
import PatientInfoScreen from '../screens/PatientInfoScreen';
import CaptureScreen from '../screens/CaptureScreen';
import ScanningScreen from '../screens/ScanningScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';
import ResultScreen from '../screens/ResultScreen';
import RecommendScreen from '../screens/RecommendScreen';
import ClinicFormScreen from '../screens/ClinicFormScreen';
import ReferScreen from '../screens/ReferScreen';
import TeamScreen from '../screens/TeamScreen';
import AddAccountScreen from '../screens/AddAccountScreen';
import ClinicHomeScreen from '../screens/ClinicHomeScreen';
import ClinicReferralScreen from '../screens/ClinicReferralScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { useScreening } from '../state/ScreeningContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Which screens exist depends on who is signed in, so signing in or out switches the whole
// app over (React Navigation's recommended auth flow) and no one can navigate past it.
export default function RootNavigator() {
  const { profile } = useScreening();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!profile ? (
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
        </Stack.Group>
      ) : profile.role === 'clinic' ? (
        <Stack.Group>
          <Stack.Screen name="ClinicHome" component={ClinicHomeScreen} />
          <Stack.Screen name="ClinicReferral" component={ClinicReferralScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="PatientInfo" component={PatientInfoScreen} />
          <Stack.Screen name="Capture" component={CaptureScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Scanning" component={ScanningScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="Recommend" component={RecommendScreen} />
          <Stack.Screen name="ClinicForm" component={ClinicFormScreen} />
          <Stack.Screen name="Refer" component={ReferScreen} />
          <Stack.Screen name="Team" component={TeamScreen} />
          <Stack.Screen name="AddAccount" component={AddAccountScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
