import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { chatSocketService } from '@/services/chat-socket.service';
import { useChatSocketStore } from '@/store/chat-socket.store';

const chatKeys = {
  myRooms: ['chat', 'rooms'] as const,
  room: (chatroomId: string) => ['chat', 'room', chatroomId] as const,
  messages: (chatroomId: string) => ['chat', 'messages', chatroomId] as const,
};

export function useMyChatRooms() {
  const queryClient = useQueryClient();
  const isConnected = useChatSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    const onNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.myRooms });
    };

    chatSocketService.onNewMessage(onNewMessage);
    return () => chatSocketService.offNewMessage(onNewMessage);
  }, [isConnected, queryClient]);

  return useQuery({
    queryKey: chatKeys.myRooms,
    queryFn: () => chatService.getMyChats(),
  });
}

export function useChatRoom(chatroomId: string) {
  return useQuery({
    queryKey: chatKeys.room(chatroomId),
    queryFn: () => chatService.getChatRoomDetail(chatroomId),
    enabled: Boolean(chatroomId),
  });
}

export function useChatMessages(chatroomId: string) {
  const queryClient = useQueryClient();
  const isConnected = useChatSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected || !chatroomId) return;

    const onNewMessage = (message: any) => {
      if (message.chatroomId === chatroomId) {
        queryClient.setQueryData(chatKeys.messages(chatroomId), (old: any) => {
          if (!old) return [message];
          if (old.some((m: any) => m.id === message.id)) return old;
          return [...old, message];
        });
      }
    };

    chatSocketService.onNewMessage(onNewMessage);
    return () => chatSocketService.offNewMessage(onNewMessage);
  }, [isConnected, chatroomId, queryClient]);

  return useQuery({
    queryKey: chatKeys.messages(chatroomId),
    queryFn: () => chatService.getChatMessages(chatroomId),
    enabled: Boolean(chatroomId),
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatroomId,
      content,
    }: {
      chatroomId: string;
      content: string;
    }) => chatService.sendMessage({ chatroomId, content }),
    onSuccess: (message) => {
      queryClient.setQueryData(chatKeys.messages(message.chatroomId), (old: any) => {
        if (!old) return [message];
        if (old.some((m: any) => m.id === message.id)) return old;
        return [...old, message];
      });
      void queryClient.invalidateQueries({ queryKey: chatKeys.myRooms });
    },
  });
}
