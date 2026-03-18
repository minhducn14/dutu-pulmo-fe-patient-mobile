import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function dataStr(value: string | object | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function normalizeScreen(screen?: string) {
  return (screen ?? '').trim().toLowerCase();
}

function resolveRouteFromData(
  data?: Record<string, string | object | undefined>,
): PushRouteTarget {
  const screen = normalizeScreen(dataStr(data?.screen));
  if (screen === 'dashboard' || screen === 'home') return '/(tabs)/home';
  if (screen === 'chat') return '/(tabs)/chat';
  if (screen === 'appointments' || screen === 'appointment') {
    if (data?.id) return `/appointments/${dataStr(data.id)}`;
    return '/(tabs)/appointments';
  }
  return '/notifications';
}

async function displayNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
) {
  const title =
    dataStr(message.data?.title) || message.notification?.title || 'Thông báo';
  const body = dataStr(message.data?.body) || message.notification?.body || '';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: message.data, // dùng để navigate khi bấm
    },
    trigger: null, // hiện ngay lập tức
  });
}

function navigateFromMessage(message: FirebaseMessagingTypes.RemoteMessage) {
  const target = resolveRouteFromData(message.data);
  router.push(target);
}

export function startPushListeners() {
  // Foreground: Firebase nhận → hiện lên notification bar
  const foregroundUnsubscribe = messaging().onMessage(async (message) => {
    await displayNotification(message);
  });

  // Khi user bấm vào notification (expo-notifications)
  const tapSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      const target = resolveRouteFromData(data as any);
      router.push(target);
    },
  );

  // Background: bấm vào notification từ Firebase
  const openAppUnsubscribe = messaging().onNotificationOpenedApp((message) => {
    navigateFromMessage(message);
  });

  // App bị kill
  void messaging()
    .getInitialNotification()
    .then((message) => {
      if (!message) return;
      setTimeout(() => navigateFromMessage(message), 400);
    });

  return () => {
    foregroundUnsubscribe();
    openAppUnsubscribe();
    tapSubscription.remove();
  };
}
type PushRouteTarget =
  | '/(tabs)/home'
  | '/(tabs)/chat'
  | '/(tabs)/appointments'
  | '/notifications'
  | `/appointments/${string}`;
