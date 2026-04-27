import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Send, Bot, User, RotateCcw, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAIChatStore, Message } from '@/store/ai-chat.store';
import { aiChatBotService } from '@/services/ai-chatbot.service';
import { TypingEffect } from '@/components/chat/TypingEffect';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function AIChatBotScreen() {
  const [inputText, setInputText] = useState('');
  const { messages, sessionId, isLoading, addMessage, setSessionId, setLoading, clearHistory } =
    useAIChatStore();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    if (!text) setInputText('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    setLoading(true);
    try {
      const response = await aiChatBotService.sendMessage(messageText, sessionId ?? undefined);

      if (response.success) {
        if (response.meta.sessionId) {
          setSessionId(response.meta.sessionId);
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message ?? '',
          timestamp: response.data.timestamp ?? new Date().toISOString(),
          suggestedActions: response.data.suggestedActions ?? [],
        };
        addMessage(aiMsg);
      }
    } catch (error: unknown) {
      console.error('[AIChatBotScreen] Error:', error);

      let errorText = 'Xin lỗi, không thể kết nối với AI. Vui lòng thử lại sau.';
      if (error instanceof Error && error.message) {
        errorText = `Lỗi: ${error.message}`;
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorText,
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [inputText, isLoading, sessionId, addMessage, setLoading, setSessionId]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isAi = item.role === 'assistant';
    const isLatestAi = isAi && index === 0;

    return (
      <View className={`mb-4 flex-row ${isAi ? 'justify-start' : 'justify-end'}`}>
        <View className="flex-row items-end gap-2 max-w-[85%]">
          {isAi && (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100 mb-1">
              <Bot size={18} color={theme.colors.primary} />
            </View>
          )}

          <View
            className={`rounded-2xl px-4 py-3 ${
              isAi ? 'bg-white border border-slate-100' : 'bg-blue-500'
            }`}
            style={isAi ? theme.shadow.card : {}}
          >
            {isLatestAi ? (
              <>
                <TypingEffect
                  text={item.content}
                  className="text-[15px] leading-6 text-slate-800"
                  speed={20}
                />
              </>
            ) : (
              <Text
                className={`text-[15px] leading-6 ${isAi ? 'text-slate-800' : 'text-white'}`}
              >
                {item.content}
              </Text>
            )}

            {isAi && item.suggestedActions && item.suggestedActions.length > 0 && (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {item.suggestedActions.map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSend(action)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-blue-600">{action}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!isAi && (
            <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 mb-1">
              <User size={18} color="#64748B" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <ScreenHeader
        title="Trợ lý AI"
        rightSlot={
          <TouchableOpacity onPress={clearHistory} className="p-2">
            <RotateCcw size={20} color="white" />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          inverted
          ListHeaderComponent={isLoading ? <TypingIndicator /> : null}
          ListEmptyComponent={
            !isLoading ? (
              <View
                style={{ height: SCREEN_HEIGHT * 0.5 }}
                className="items-center justify-center opacity-40"
              >
                <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                  <Sparkles size={40} color={theme.colors.primary} />
                </View>
                <Text className="text-base font-bold text-slate-700">Chào bạn!</Text>
                <Text className="mt-1 text-center text-sm text-slate-400">
                  Tôi là Trợ lý AI chuyên về sức khỏe hô hấp.{'\n'}Bạn đang cảm thấy thế nào?
                </Text>
              </View>
            ) : null
          }
        />

        <View 
          className="border-t border-slate-100 bg-white p-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Input
                placeholder="Nhập câu hỏi của bạn..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                multiline
                style={{ paddingTop: 10, paddingBottom: 10, maxHeight: 100 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className={`h-12 w-12 items-center justify-center rounded-xl ${
                !inputText.trim() || isLoading ? 'bg-slate-100' : 'bg-blue-500'
              }`}
            >
              <Send size={20} color={!inputText.trim() || isLoading ? '#94A3B8' : 'white'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default AIChatBotScreen;