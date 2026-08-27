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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="PatientInfo" component={PatientInfoScreen} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Scanning" component={ScanningScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Recommend" component={RecommendScreen} />
    </Stack.Navigator>
  );
}
