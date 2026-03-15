import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../../global.css';

import { AppQueryProvider } from '@/providers/query-provider';
import { useAuthStore } from '@/store/auth.store';
import { useSegments, useRouter } from 'expo-router';
import { Loading } from '@/components/ui/Loading';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [accessToken, hydrated, segments]);

  if (!hydrated) return <Loading label="Đang tải..." />;

  return <>{children}</>;
}

export default function RootLayout() {
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  return (
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
  );
}
