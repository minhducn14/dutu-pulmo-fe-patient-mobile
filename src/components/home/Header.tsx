import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useNotificationUnreadCount } from '@/hooks/useNotifications';
import { useAuthStore } from '@/store/auth.store';

export function Header() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { data: unreadData } = useNotificationUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const currentHour = new Date().getHours();
  let greeting = 'Chào buổi tối!';
  if (currentHour < 12) greeting = 'Chào buổi sáng!';
  else if (currentHour < 18) greeting = 'Chào buổi chiều!';

  return (
    <View 
      className="bg-primary pb-14 px-4 rounded-b-3xl"
      style={{ paddingTop: Math.max(insets.top, 16) + 12 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-2 pr-3 border-r border-white/20">
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center overflow-hidden">
              <Image
                source={require('@/assets/images/logo.jpg')}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-white font-bold text-base leading-tight">Dutu</Text>
              <Text className="text-secondary font-bold text-base leading-tight">Pulmo</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 pl-1">
            <Image
              source={{
                uri: user?.avatarUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBlsQ3DvfFlr_UgmmwE9It1YpLX8WBOWH06ZQqHysA90z-joKXMu4MZhrbe-cPkp1V9u1uEhXXfEPBL7Tw7C_c9xGTQuY7Del_d-yQpoVNHAWTxYvVf_MiAbNF-0SRxRH6OYRq3__dNi_pR5fBRRP56xt_RP7yrMgDkOqmh8vE5v2PhHBBf4GzodYp-JO5RVpHaBQhDZSlh9X3BTCHvX3U2i-IFMBYoQT626xH4aUrD9qM7q6tlAywfRcibQz5e0bG6lIEveyWKPEFJ',
              }}
              className="w-10 h-10 rounded-full border border-white/30"
            />
            <View>
              <Text className="text-white/80 text-xs font-semibold uppercase tracking-wide">
                {greeting}
              </Text>
              <Text className="text-white font-bold text-base">
                {user?.fullName || 'Khach'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable className="relative" onPress={() => router.push('/notifications')}>
          <View className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
            <MaterialIcons name="notifications" size={22} color="white" />
          </View>
          {unreadCount > 0 ? (
            <View className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-primary items-center justify-center">
              <Text className="text-white text-[9px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View
        className="absolute -bottom-7 left-4 right-4 bg-white rounded-2xl h-14 flex-row items-center px-3.5"
        style={theme.shadow.card}
      >
        <MaterialIcons
          name="search"
          size={22}
          color="#94A3B8"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
          placeholderTextColor="#94A3B8"
          className="flex-1 text-sm text-gray-800 font-medium"
        />
      </View>
    </View>
  );
}
