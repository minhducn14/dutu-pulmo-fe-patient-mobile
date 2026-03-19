import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}

interface AIChatState {
  messages: Message[];
  sessionId: string | null;
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      messages: [],
      sessionId: null,
      isLoading: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setSessionId: (id) => set({ sessionId: id }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearHistory: () => set({ messages: [], sessionId: null }),
    }),
    {
      name: 'ai-chat-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
