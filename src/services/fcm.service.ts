import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import { api } from '@/services/api';

function isPermissionGranted(
  status: FirebaseMessagingTypes.AuthorizationStatus,
) {
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerFcmTokenAfterLogin() {
  const permission = await messaging().requestPermission();
  if (!isPermissionGranted(permission)) {
    return null;
  }

  const token = await messaging().getToken();
  if (!token) {
    return null;
  }

  await api.post('/users/me/fcm-token', { token });
  return token;
}

export async function removeFcmTokenBestEffort() {
  try {
    const token = await messaging().getToken();
    if (!token) {
      return;
    }

    await api.delete('/users/me/fcm-token', {
      data: { token },
    });
  } catch {
    // best-effort cleanup when logout or push toggle off
  }
}
