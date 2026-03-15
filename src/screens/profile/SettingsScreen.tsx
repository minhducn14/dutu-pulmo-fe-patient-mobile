import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';

export function SettingsScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <ScrollView className="flex-1 bg-background-light" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text className="text-2xl font-bold text-slate-900">Settings</Text>

      <Card className="mt-4">
        <Text className="text-base font-bold text-slate-900">Account</Text>
        <Text className="mt-2 text-sm text-slate-600">App version: mobile v1</Text>
        <Text className="mt-1 text-sm text-slate-600">Language: English</Text>
      </Card>

      <View className="mt-4">
        <Button
          title="Sign out"
          onPress={() => {
            clearSession();
            console.log('Redirecting to login in SettingsScreen');
          }}
        />
      </View>
    </ScrollView>
  );
}

export default SettingsScreen;
