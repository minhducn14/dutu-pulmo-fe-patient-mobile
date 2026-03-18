import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useMyChatRooms } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import ScreenHeader from '@/components/ui/ScreenHeader';

// ─── Chat room card ────────────────────────────────────────────────────────────
function ChatRoomCard({
  room,
  currentUserId,
  onPress,
}: {
  room: any;
  currentUserId?: string;
  onPress: () => void;
}) {
  const peer = room.user1?.id === currentUserId ? room.user2 : room.user1;
  const updatedAt = new Date(room.updatedAt);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const initials = peer?.fullName
    ? peer.fullName.split(' ').slice(-2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')
    : '?';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center gap-3 bg-white px-4 py-[14px]"
    >
      {/* Avatar */}
      <View className="relative">
        {peer?.avatarUrl ? (
          <Image
            source={{ uri: peer.avatarUrl }}
            className="h-14 w-14 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Text className="text-lg font-bold text-blue-600">{initials}</Text>
          </View>
        )}
        {/* Online dot */}
        <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
      </View>

      {/* Info */}
      <View className="flex-1 border-b border-slate-50 pb-[14px]">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
            {peer?.fullName ?? 'Người dùng'}
          </Text>
          <Text className="text-[11px] text-slate-400">{formatTime(updatedAt)}</Text>
        </View>
        <Text className="mt-0.5 text-[13px] text-slate-500" numberOfLines={1}>
          {peer?.email ?? ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function ChatScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const roomsQuery = useMyChatRooms();

  if (roomsQuery.isLoading) {
    return <Loading label="Đang tải tin nhắn..." />;
  }

  if (roomsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải tin nhắn"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const rooms = roomsQuery.data ?? [];

  return (
    <View className="flex-1" >
      {/* HEADER */}
      <ScreenHeader title="Chat" hideBack={true} />

      {rooms.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <MaterialIcons name="chat-bubble-outline" size={36} color="#93c5fd" />
          </View>
          <Text className="text-base font-bold text-slate-700">Chưa có cuộc hội thoại</Text>
          <Text className="mt-1 text-center text-sm text-slate-400">
            Bắt đầu chat với bác sĩ sau khi đặt lịch khám
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/doctors')}
            activeOpacity={0.85}
            className="mt-6 flex-row items-center gap-2 rounded-2xl bg-blue-500 px-8 py-3"
            style={{
              shadowColor: '#0A7CFF',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <MaterialIcons name="person-search" size={18} color="white" />
            <Text className="text-sm font-bold text-white">Tìm bác sĩ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <View className="px-4 py-3">
            <Text className="text-sm text-slate-500">
              <Text className="font-bold text-slate-900">{rooms.length}</Text> cuộc hội thoại
            </Text>
          </View>

          {/* List */}
          <View>
            {rooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                currentUserId={user?.id}
                onPress={() =>
                  router.push({
                    pathname: '/chat/[chatroomId]',
                    params: { chatroomId: room.id },
                  })
                }
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default ChatScreen;