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
import { Send, Bot, User, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAIChatStore, Message } from '@/store/ai-chat.store';
import { aiChatBotService } from '@/services/ai-chatbot.service';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { BookingPanel, type BookingData } from '@/components/chat/BookingPanel';
import type { ConfirmDetail } from '@/services/ai-chatbot.service';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { theme } from '@/constants/theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface MarkdownMessageProps {
  content: string;
  color: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, color }) => {
  return (
    <Markdown
      style={{
        body: { color, fontSize: 15, lineHeight: 24 },
        paragraph: { marginTop: 0, marginBottom: 8 },
        strong: { fontWeight: '700', color },
        em: { fontStyle: 'italic', color },
        bullet_list: { marginTop: 0, marginBottom: 8 },
        ordered_list: { marginTop: 0, marginBottom: 8 },
        list_item: { marginBottom: 2 },
        bullet_list_icon: { color },
        bullet_list_content: { color, flex: 1 },
        ordered_list_icon: { color },
        ordered_list_content: { color, flex: 1 },
        heading1: { color, fontSize: 18, lineHeight: 26, fontWeight: '700', marginTop: 4, marginBottom: 8 },
        heading2: { color, fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 4, marginBottom: 8 },
        heading3: { color, fontSize: 16, lineHeight: 24, fontWeight: '700', marginTop: 4, marginBottom: 8 },
        link: { color: theme.colors.primary, textDecorationLine: 'underline' },
      }}
    >
      {content}
    </Markdown>
  );
};

const TypingMarkdownMessage: React.FC<
  MarkdownMessageProps & { speed?: number }
> = ({ content, color, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');

  React.useEffect(() => {
    setDisplayedText('');
    const chars = Array.from(content.replace(/[\u200B-\u200D\uFEFF]/g, ''));
    let index = 0;

    const timer = setInterval(() => {
      if (index < chars.length) {
        const char = chars[index] ?? '';
        setDisplayedText((previous) => previous + char);
        index += 1;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, speed]);

  return (
    <MarkdownMessage
      content={displayedText}
      color={color}
    />
  );
};

export function AIChatBotScreen() {
  const [inputText, setInputText] = useState('');
  const {
    messages,
    sessionId,
    isLoading,
    addMessage,
    setSessionId,
    setLoading,
    clearHistory,
    updateMessage,
  } = useAIChatStore();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const cleanMessageContent = useCallback((text: string) => {
    return text.replace(/(?:^|\n)(?:date|time|type):\s*[^\n]*/gi, '').trim();
  }, []);

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

        const responseData = response.data as typeof response.data & {
          action?: string;
          bookingData?: BookingData;
        };

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message ?? '',
          timestamp: response.data.timestamp ?? new Date().toISOString(),
          suggestedActions: response.data.suggestedActions ?? [],
          bookingData:
            responseData.action === 'OPEN_BOOKING' && responseData.bookingData?.doctorId
              ? responseData.bookingData
              : undefined,
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

  const handleBookingConfirm = useCallback((
    messageId: string,
    _detail: ConfirmDetail,
    confirmMessage: string,
  ) => {
    updateMessage(messageId, { isBookingCompleted: true });

    const confirmMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: confirmMessage,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        'Xem lịch hẹn của tôi',
        'Chuẩn bị gì trước khi khám?',
        'Đặt lịch khác',
      ],
    };

    addMessage(confirmMsg);
  }, [addMessage, updateMessage]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isAi = item.role === 'assistant';
    const isLatestAi = isAi && index === 0;
    const displayContent = cleanMessageContent(item.content);

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
              <TypingMarkdownMessage
                content={displayContent}
                color="#1F2937"
                speed={20}
              />
            ) : (
              isAi ? (
                <MarkdownMessage
                  content={displayContent}
                  color="#1F2937"
                />
              ) : (
                <Text className="text-[15px] leading-6 text-white">
                  {displayContent}
                </Text>
              )
            )}

            {isAi && item.bookingData && (
              <View className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {item.isBookingCompleted ? (
                  <View className="items-center justify-center gap-2 bg-green-50 px-4 py-6">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 size={24} color="#16A34A" />
                    </View>
                    <Text className="text-center text-sm font-bold text-slate-800">
                      Lịch khám đã được xác nhận!
                    </Text>
                    <Text className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Bạn đã hoàn tất đặt lịch cho tin nhắn này
                    </Text>
                  </View>
                ) : (
                  <BookingPanel
                    messageId={item.id}
                    bookingData={item.bookingData}
                    sessionId={sessionId}
                    onConfirm={(detail, message) =>
                      handleBookingConfirm(item.id, detail, message)
                    }
                  />
                )}
              </View>
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
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
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
