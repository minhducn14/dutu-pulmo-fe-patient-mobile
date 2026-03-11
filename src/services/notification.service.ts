import { api } from '@/services/api';
import { cleanParams } from '@/utils/query';
import type {
  NotificationMarkReadResponse,
  NotificationUnreadCountResponseDto,
  PaginatedNotificationResponseDto,
} from '@/types/notification.types';

export type NotificationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
};

export const notificationService = {
  getNotifications: async (query?: NotificationQuery) => {
    const { data } = await api.get<PaginatedNotificationResponseDto>('/notifications', {
      params: cleanParams(query),
    });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get<NotificationUnreadCountResponseDto>('/notifications/unread-count');
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.patch<NotificationMarkReadResponse>('/notifications/read-all');
    return data;
  },

  markAsRead: async (notificationId: string) => {
    const { data } = await api.patch<NotificationMarkReadResponse>(`/notifications/${notificationId}/read`);
    return data;
  },
};

export default notificationService;
