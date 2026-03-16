import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/hooks/useNotifications';

// ─── Notification type config ─────────────────────────────────────────────────
const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; bgColor: string }
> = {
  APPOINTMENT: { icon: 'calendar-today', color: '#0A7CFF', bgColor: '#EFF6FF' },
  PAYMENT: { icon: 'payment', color: '#16a34a', bgColor: '#F0FDF4' },
  SYSTEM: { icon: 'notifications', color: '#d97706', bgColor: '#FFFBEB' },
  DEFAULT: { icon: 'info', color: '#64748b', bgColor: '#F8FAFC' },
};

// ─── Notification card ─────────────────────────────────────────────────────────
function NotificationCard({
  item,
  onMarkRead,
  isMarking,
}: {
  item: any;
  onMarkRead: () => void;
  isMarking: boolean;
}) {
  const isRead = item.status === 'ACTIVE'; // ACTIVE = đã đọc, PENDING = chưa đọc
  const typeConfig =
    NOTIFICATION_TYPE_CONFIG[item.type] ?? NOTIFICATION_TYPE_CONFIG['DEFAULT'];

  const createdAt = item.createdAt ? new Date(item.createdAt) : null;
  const timeLabel = createdAt
    ? createdAt.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <TouchableOpacity
      onPress={onMarkRead}
      activeOpacity={0.85}
      className={`flex-row gap-3 px-4 py-4 ${isRead ? '' : 'bg-blue-50/40'}`}
    >
      {/* Icon */}
      <View
        className="mt-0.5 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: typeConfig.bgColor }}
      >
        <MaterialIcons
          name={typeConfig.icon as any}
          size={20}
          color={typeConfig.color}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`flex-1 text-[14px] leading-[20px] ${
              isRead ? 'font-normal text-slate-700' : 'font-semibold text-slate-900'
            }`}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {!isRead && (
            <View className="mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </View>
        <Text
          className="mt-1 text-[13px] leading-[18px] text-slate-500"
          numberOfLines={3}
        >
          {item.content}
        </Text>
        <Text className="mt-2 text-[11px] text-slate-400">{timeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function NotificationsScreen() {
  const router = useRouter();
  const notificationsQuery = useNotifications({ page: 1, limit: 50 });
  const markOneMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  if (notificationsQuery.isLoading) return <Loading label="Đang tải thông báo..." />;

  if (notificationsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải thông báo"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notifications.filter((n: any) => n.status === 'PENDING').length;

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View className="bg-blue-500 px-4 pb-4 pt-12">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-white">Thông báo</Text>
            {unreadCount > 0 && (
              <Text className="mt-0.5 text-[13px] text-blue-100">
                {unreadCount} chưa đọc
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              activeOpacity={0.7}
              className="rounded-full border border-blue-400 px-3 py-1.5"
            >
              <Text className="text-[12px] font-semibold text-white">
                {markAllMutation.isPending ? 'Đang xử lý...' : 'Đọc tất cả'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <MaterialIcons name="notifications-none" size={36} color="#93c5fd" />
          </View>
          <Text className="text-base font-bold text-slate-700">Chưa có thông báo</Text>
          <Text className="mt-1 text-center text-sm text-slate-400">
            Các thông báo về lịch khám và thanh toán sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
        >
          {/* Unread section */}
          {unreadCount > 0 && (
            <>
              <View className="border-b border-slate-100 px-4 py-3">
                <Text className="text-[11px] font-bold tracking-[0.8px] text-slate-400">
                  CHƯA ĐỌC
                </Text>
              </View>
              {notifications
                .filter((n: any) => n.status === 'PENDING')
                .map((item: any) => (
                  <View key={item.id} className="border-b border-slate-50">
                    <NotificationCard
                      item={item}
                      onMarkRead={() => markOneMutation.mutate(item.id)}
                      isMarking={markOneMutation.isPending}
                    />
                  </View>
                ))}
            </>
          )}

          {/* Read section */}
          {notifications.filter((n: any) => n.status === 'ACTIVE').length > 0 && (
            <>
              <View className="border-b border-slate-100 px-4 py-3">
                <Text className="text-[11px] font-bold tracking-[0.8px] text-slate-400">
                  ĐÃ ĐỌC
                </Text>
              </View>
              {notifications
                .filter((n: any) => n.status === 'ACTIVE')
                .map((item: any) => (
                  <View key={item.id} className="border-b border-slate-50">
                    <NotificationCard
                      item={item}
                      onMarkRead={() => {}}
                      isMarking={false}
                    />
                  </View>
                ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

export default NotificationsScreen;