import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../../global.css';

import { AppQueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/auth.store';
import { Loading } from '@/components/ui/Loading';
import { startPushListeners } from '@/services/push-listener.service';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Redirect } from 'expo-router';
import * as Notifications from 'expo-notifications';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const segments = useSegments();

  if (!hydrated) {
    return <Loading label="Đang tải..." />;
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!accessToken && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (accessToken && inAuthGroup) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    const stopListeners = startPushListeners();
    return stopListeners;
  }, []);

  return (
    <SafeAreaProvider>
      <AppQueryProvider>
        <StatusBar style="dark" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGuard>
      </AppQueryProvider>
    </SafeAreaProvider>
  );
}
