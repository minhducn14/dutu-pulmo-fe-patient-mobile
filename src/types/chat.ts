export interface ChatUserBasic {
  id: string;
  fullName: string;
  email: string;
}

export interface ChatRoom {
  id: string;
  user1: ChatUserBasic;
  user2: ChatUserBasic;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatroomId: string;
  sender: ChatUserBasic;
  content: string;
  createdAt: string;
}

export type LocalMessageStatus = 'sending' | 'sent' | 'failed';

export interface LocalChatMessage extends ChatMessage {
  tempId?: string;
  status: LocalMessageStatus;
  clientSentAt?: number;
}

export interface TypingUser {
  userId: string;
  fullName: string;
  isTyping: boolean;
  timestamp: number;
}

export interface OnlineUser {
  id: string;
  fullName: string;
  email: string;
}

export interface JoinRoomPayload {
  chatroomId: string;
}

export interface TypingPayload {
  chatroomId: string;
  isTyping: boolean;
}
