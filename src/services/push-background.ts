import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (__DEV__) {
    console.log('[push] Background message:', remoteMessage?.messageId);
  }
});
