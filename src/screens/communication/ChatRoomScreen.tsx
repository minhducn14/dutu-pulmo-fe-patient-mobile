import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useChatMessages, useChatRoom, useSendChatMessage } from '@/hooks/useChat';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { useAuthStore } from '@/store/auth.store';
import { APP_CONFIG } from '@/constants/config';

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  isMine,
}: {
  message: any;
  isMine: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isMine) {
    return (
      <View className="mb-2 flex-row justify-end">
        <View className="max-w-[75%]">
          <View
            className="rounded-[18px] rounded-tr-[4px] bg-blue-500 px-4 py-[10px]"
            style={{
              shadowColor: '#0A7CFF',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-sm leading-[20px] text-white">{message.content}</Text>
          </View>
          <Text className="mt-1 text-right text-[10px] text-slate-400">{time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-2 flex-row items-end gap-2">
      {/* Avatar placeholder */}
      <View className="mb-4 h-7 w-7 items-center justify-center rounded-full bg-blue-100">
        <MaterialIcons name="person" size={14} color="#60a5fa" />
      </View>
      <View className="max-w-[75%]">
        <View
          className="rounded-[18px] rounded-tl-[4px] bg-white px-4 py-[10px]"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text className="text-sm leading-[20px] text-slate-900">{message.content}</Text>
        </View>
        <Text className="mt-1 text-[10px] text-slate-400">{time}</Text>
      </View>
    </View>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="h-1.5 w-1.5 rounded-full bg-slate-300"
    />
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <View className="mb-2 flex-row items-end gap-2">
      <View className="mb-4 h-7 w-7 items-center justify-center rounded-full bg-blue-100">
        <MaterialIcons name="person" size={14} color="#60a5fa" />
      </View>
      <View className="rounded-[18px] rounded-tl-[4px] bg-white px-4 py-3 border border-slate-50">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1">
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
          </View>
          <Text className="text-[11px] font-medium text-slate-400">{name} đang nhập...</Text>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function ChatRoomScreen() {
  const router = useRouter();
  const { chatroomId } = useLocalSearchParams<{ chatroomId: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ userId: string; fullName: string }[]>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitAtRef = useRef(0);
  const isTypingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  const roomQuery = useChatRoom(chatroomId);
  const messagesQuery = useChatMessages(chatroomId);
  const sendMutation = useSendChatMessage();

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await Promise.all([roomQuery.refetch(), messagesQuery.refetch()]);
  });

  // Merge server messages + realtime messages
  const serverMessages = messagesQuery.data ?? [];
  const allMessages = [
    ...serverMessages,
    ...realtimeMessages.filter(
      (rm) => !serverMessages.find((sm: any) => sm.id === rm.id),
    ),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // ── Socket.IO setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatroomId || !accessToken) return;

    const socket: Socket = io(`${APP_CONFIG.API_BASE_URL}/chat`, {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', { chatroomId });
    });

    socket.on('new-message', (msg: any) => {
      setRealtimeMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Scroll to bottom
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('connect_error', (err) => {
      console.warn('[ChatSocket] connect_error:', err.message);
    });

    return () => {
      console.log('[ChatSocket] Disconnecting socket');
      socket.emit('leave-room', { chatroomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatroomId, accessToken, user?.id]);

  // ── Scroll to bottom on load ────────────────────────────────────────────────
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [messagesQuery.isFetched]);

  const handleEmitTyping = (isTyping: boolean, force = false) => {
    if (!chatroomId || !socketRef.current?.connected) return;
    
    // Chỉ gửi khi có sự thay đổi trạng thái hoặc buộc gửi (force)
    if (!force && isTypingRef.current === isTyping) return;

    const now = Date.now();
    // Throttling: giới hạn tần suất gửi isTyping: true (300ms)
    if (!force && isTyping && now - lastTypingEmitAtRef.current < 300) return;

    lastTypingEmitAtRef.current = now;
    isTypingRef.current = isTyping;
    
    socketRef.current.emit('typing', { 
      chatroomId: chatroomId.trim(), 
      isTyping 
    });
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    handleEmitTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleEmitTyping(false, true);
    }, 1500);
  };

  const onSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Stop typing indicator
    handleEmitTyping(false, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setContent('');
    sendMutation.mutate(
      { chatroomId, content: trimmed },
      {
        onSuccess: (msg) => {
          setRealtimeMessages((prev) => {
            if (prev.find((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
      },
    );
  };

  if (roomQuery.isLoading || messagesQuery.isLoading) {
    return <Loading label="Đang tải cuộc hội thoại..." />;
  }

  if (roomQuery.isError || !roomQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải cuộc hội thoại"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const room = roomQuery.data;
  const peer = room.user1?.id === user?.id ? room.user2 : room.user1;
  const peerName = peer?.fullName ?? 'Bác sĩ';

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View 
        className="flex-row items-center gap-3 bg-blue-500 px-4 pb-3 shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>

        {/* Peer info */}
        <View className="flex-1 flex-row items-center gap-2.5">
          <View className="relative">
            {peer?.avatarUrl ? (
              <Image
                source={{ uri: peer.avatarUrl }}
                className="h-10 w-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-400">
                <MaterialIcons name="person" size={20} color="white" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-blue-500 bg-green-400" />
          </View>
          <View>
            <Text className="text-[15px] font-bold text-white">{peerName}</Text>
            <Text className="text-[11px] text-blue-100">
              {typingUsers.length > 0 ? 'Đang nhập...' : 'Đang hoạt động'}
            </Text>
          </View>
        </View>

        {/* More options */}
        <TouchableOpacity activeOpacity={0.7} className="rounded-full p-1">
          <MaterialIcons name="more-vert" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item, idx) => item.id ?? String(idx)}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <MaterialIcons name="chat-bubble-outline" size={28} color="#93c5fd" />
              </View>
              <Text className="text-sm font-medium text-slate-500">
                Bắt đầu cuộc trò chuyện
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-400">
                Hãy gửi tin nhắn đầu tiên!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.sender?.id === user?.id}
            />
          )}
          ListFooterComponent={
            typingUsers.length > 0 ? (
              <TypingIndicator name={typingUsers[0].fullName} />
            ) : null
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input bar */}
        <View
          className="flex-row items-end gap-2 border-t border-slate-100 bg-white px-3 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          {/* Text input with counter */}
          <View className="flex-1 flex-col gap-1">
            <View className="flex-row items-end rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-2.5">
              <TextInput
                value={content}
                onChangeText={handleContentChange}
                onBlur={() => handleEmitTyping(false, true)}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={2000}
                className="flex-1 text-sm leading-5 text-slate-900"
                style={{ 
                  paddingTop: 0, 
                  paddingBottom: 0,
                  maxHeight: 110, // Giới hạn khoảng 5 dòng (mỗi dòng ~20-22px)
                }}
              />
            </View>
            <Text className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              {content.length}/2000
            </Text>
          </View>

          {/* Send button */}
          <TouchableOpacity
            onPress={onSend}
            disabled={!content.trim() || sendMutation.isPending}
            activeOpacity={0.85}
            className={`h-[44px] w-[44px] items-center justify-center rounded-full ${content.trim() ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            style={
              content.trim()
                ? {
                  shadowColor: '#0A7CFF',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 3 },
                  shadowRadius: 6,
                  elevation: 4,
                }
                : undefined
            }
          >
            <MaterialIcons
              name="send"
              size={20}
              color={content.trim() ? 'white' : '#94a3b8'}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default ChatRoomScreen;