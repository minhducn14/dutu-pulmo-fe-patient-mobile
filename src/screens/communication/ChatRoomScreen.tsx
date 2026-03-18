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
} from 'react-native';
import { io, Socket } from 'socket.io-client';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useChatMessages, useChatRoom, useSendChatMessage } from '@/hooks/useChat';
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
function TypingIndicator({ name }: { name: string }) {
  return (
    <View className="mb-2 flex-row items-end gap-2">
      <View className="mb-4 h-7 w-7 items-center justify-center rounded-full bg-blue-100">
        <MaterialIcons name="person" size={14} color="#60a5fa" />
      </View>
      <View className="rounded-[18px] rounded-tl-[4px] bg-white px-4 py-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-[11px] text-slate-400 italic">{name} đang nhập</Text>
          <View className="flex-row gap-0.5">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-slate-400"
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function ChatRoomScreen() {
  const router = useRouter();
  const { chatroomId } = useLocalSearchParams<{ chatroomId: string }>();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ userId: string; fullName: string }[]>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const roomQuery = useChatRoom(chatroomId);
  const messagesQuery = useChatMessages(chatroomId);
  const sendMutation = useSendChatMessage();

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

    socket.on('user-typing', ({ users }: { chatroomId: string; users: any[] }) => {
      setTypingUsers(
        users
          .filter((u) => u.userId !== user?.id)
          .map((u) => ({ userId: u.userId, fullName: u.fullName })),
      );
    });

    socket.on('connect_error', (err) => {
      console.warn('[ChatSocket] connect_error:', err.message);
    });

    return () => {
      socket.emit('leave-room', { chatroomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatroomId, accessToken]);

  // ── Scroll to bottom on load ────────────────────────────────────────────────
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [messagesQuery.isFetched]);

  const handleContentChange = (text: string) => {
    setContent(text);

    // Emit typing
    socketRef.current?.emit('typing', { chatroomId, isTyping: true });

    // Auto-stop typing after 2s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { chatroomId, isTyping: false });
    }, 2000);
  };

  const onSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    // Stop typing indicator
    socketRef.current?.emit('typing', { chatroomId, isTyping: false });
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
      {/* HEADER */}
      <View className="flex-row items-center gap-3 bg-primary px-4 pb-4 pt-12">
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
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item, idx) => item.id ?? String(idx)}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
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
          className={`flex-row items-end gap-2 border-t border-slate-100 bg-white px-3 pt-3 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-3'
            }`}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          {/* Text input */}
          <View className="flex-1 flex-row items-end rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-2.5">
            <TextInput
              value={content}
              onChangeText={handleContentChange}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={2000}
              className="max-h-[120px] flex-1 text-sm leading-5 text-slate-900"
              style={{ paddingTop: 0, paddingBottom: 0 }}
            />
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