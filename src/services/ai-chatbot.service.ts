import axios from 'axios';
import { APP_CONFIG } from '@/constants/config';

export interface AIChatResponse {
  success: boolean;
  data: {
    message: string;
    type: string;
    severity: string;
    timestamp: string;
    disclaimer?: string | null;
    suggestedActions: string[];
  };
  meta: {
    sessionId: string;
    queryType: string;
    processedAt: string;
  };
}

export const aiChatBotService = {
  sendMessage: async (message: string, sessionId?: string): Promise<AIChatResponse> => {
    console.log('[AI Service] Sending message:', { message, sessionId });
    console.log('[AI Service] Target URL:', APP_CONFIG.AI_WEBHOOK_URL);

    if (!APP_CONFIG.AI_WEBHOOK_URL) {
      console.error('[AI Service] Error: AI Webhook URL is missing in config');
      throw new Error('AI Webhook URL is not configured');
    }

    try {
      const response = await axios.post<AIChatResponse>(APP_CONFIG.AI_WEBHOOK_URL, {
        message,
        sessionId,
      });

      console.log('[AI Service] Response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[AI Service] Request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      throw error;
    }
  },
};
