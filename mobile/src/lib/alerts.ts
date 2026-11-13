import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

// Referral alerts on the phone: a system notification when a clinic gets a new referral,
// or when a health worker's referral is marked attended or treated (or gets a clinic note).

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const ALERT_CHANNEL = 'referrals';
const supported = Platform.OS === 'android' || Platform.OS === 'ios';

export type AlertData = { referralId: string };

// True once this phone is registered for lock-screen push. The app then only shows its own
// alerts while it is in front, and leaves the rest to push, so nothing shows twice.
let pushActive = false;
export const isPushActive = () => pushActive;

/** Whether the app should raise its own alert for a change it just noticed. */
export function shouldAlertLocally(): boolean {
  return !pushActive || AppState.currentState === 'active';
}

/** Call once at start-up: show alerts even while the app is open. */
export function setupAlerts(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    // A push arriving while the app is open is already shown by the app's own alert.
    handleNotification: async n => {
      const trigger = n.request.trigger as { type?: string } | null;
      const show = trigger?.type !== 'push';
      return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
    },
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
      name: 'Referral alerts',
      description: 'New referrals, and patients marked attended or treated',
      importance: Notifications.AndroidImportance.HIGH,
    }).catch(() => {});
  }
}

/** Asks for permission to show notifications (once; later calls just report the answer). */
export async function ensureAlertPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function showAlert(title: string, body: string, data: AlertData): Promise<void> {
  if (!supported) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: Platform.OS === 'android' ? { channelId: ALERT_CHANNEL } : null,
    });
  } catch {
    // Notifications switched off in the phone's settings: nothing to show.
  }
}

/**
 * This phone's Firebase push token, or null when push isn't available (Firebase not set up
 * in this build, iPhone, web, or notifications not allowed).
 */
export async function devicePushToken(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const t = await Notifications.getDevicePushTokenAsync();
    pushActive = typeof t.data === 'string' && t.data.length > 0;
    return pushActive ? (t.data as string) : null;
  } catch {
    pushActive = false;
    return null;
  }
}

export function forgetPush(): void {
  pushActive = false;
}

/** Opens the referral behind a tapped alert. */
export function listenForAlertTaps(open: (data: AlertData) => void): () => void {
  if (!supported) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(res => {
    const data = res.notification.request.content.data as Partial<AlertData> | undefined;
    if (data?.referralId) open({ referralId: data.referralId });
  });
  return () => sub.remove();
}
