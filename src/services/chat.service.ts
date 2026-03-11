import { api } from '@/services/api';
import type {
  ChatMessageResponseDto,
  ChatRoomResponseDto,
  CreateChatMessageDto,
  CreateChatRoomDto,
} from '@/types/generated/patient-api';

export const chatService = {
  createOrGetRoom: async (payload: CreateChatRoomDto) => {
    const { data } = await api.post<ChatRoomResponseDto>('/chatrooms', payload);
    return data;
  },

  getMyChats: async () => {
    const { data } = await api.get<ChatRoomResponseDto[]>('/chatrooms/my-chats');
    return data;
  },

  getChatRoomDetail: async (chatroomId: string) => {
    const { data } = await api.get<ChatRoomResponseDto>(`/chatrooms/${chatroomId}`);
    return data;
  },

  getChatMessages: async (chatroomId: string) => {
    const { data } = await api.get<ChatMessageResponseDto[]>(`/chatmessages/chatroom/${chatroomId}`);
    return data;
  },

  sendMessage: async (payload: CreateChatMessageDto) => {
    const { data } = await api.post<ChatMessageResponseDto>('/chatmessages', payload);
    return data;
  },
};

export default chatService;
