import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { theme } from '@/constants/theme';

interface DoctorDetailHeaderProps {
  titleLabel: string;
  displayName: string;
  experience?: number;
  specialty: string;
  avatarUrl?: string;
  isSaved: boolean;
  canChat: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onChat: () => void;
}

export function DoctorDetailHeader({
  titleLabel,
  displayName,
  experience,
  specialty,
  avatarUrl,
  isSaved,
  canChat,
  onBack,
  onToggleSave,
  onChat,
}: DoctorDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable onPress={onBack} style={{ padding: 8, marginLeft: -8 }}>
              <MaterialIcons name="arrow-back-ios" size={20} color="white" />
            </Pressable>
            <Text
              numberOfLines={1}
              className="text-lg font-semibold text-white"
            >
              Thông tin bác sĩ
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onToggleSave}
              className="flex-row items-center gap-1"
            >
              <MaterialIcons
                name={isSaved ? 'favorite' : 'favorite-border'}
                size={20}
                color={isSaved ? '#FDE047' : 'white'}
              />
              <Text className="text-xs font-medium text-white">
                {isSaved ? 'Đã lưu' : 'Lưu lại'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onChat}
              disabled={!canChat}
              className="flex-row items-center gap-1"
              style={{ opacity: canChat ? 1 : 0.5 }}
            >
              <MaterialIcons name="help-outline" size={20} color="white" />
              <Text className="text-xs font-medium text-white">Hỗ trợ</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mb-2 bg-white px-4 py-5 shadow-sm">
        <View className="flex-row gap-4">
          <View className="relative">
            <Avatar uri={avatarUrl} size={80} />
            <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
              <MaterialIcons name="verified" size={12} color="white" />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-500">
              {titleLabel}
            </Text>
            <Text className="mt-0.5 text-xl font-extrabold uppercase leading-tight text-gray-900">
              {displayName}
            </Text>
            <View
              className="mt-1 flex-row items-center gap-1"
              style={{ flexShrink: 0 }}
            >
              <MaterialIcons
                name="verified"
                size={15}
                color={theme.colors.primary}
              />
              <Text
                numberOfLines={1}
                className="text-sm font-semibold text-blue-600"
              >
                Bác sĩ
              </Text>
            </View>

            {experience ? (
              <Text className="mt-0.5 text-sm text-gray-500">
                {experience} năm kinh nghiệm
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <Text className="text-sm text-gray-500">Chuyên khoa:</Text>
          <View className="rounded-full bg-blue-50 px-3 py-1">
            <Text className="text-sm font-semibold text-blue-600">
              {specialty}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
