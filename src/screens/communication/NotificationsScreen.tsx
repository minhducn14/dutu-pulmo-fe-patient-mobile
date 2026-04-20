import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import type { NotificationItem } from '@/types/notification.types';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { icon: MaterialIconName; color: string; bgColor: string }
> = {
  APPOINTMENT: { icon: 'calendar-today', color: '#0A7CFF', bgColor: '#EFF6FF' },
  PAYMENT: { icon: 'payment', color: '#16a34a', bgColor: '#F0FDF4' },
  SYSTEM: { icon: 'notifications', color: '#d97706', bgColor: '#FFFBEB' },
  DEFAULT: { icon: 'info', color: '#64748b', bgColor: '#F8FAFC' },
};

function NotificationCard({
  item,
  onMarkRead,
  isMarking,
}: {
  item: NotificationItem;
  onMarkRead?: () => void;
  isMarking: boolean;
}) {
  const isRead = item.status === 'READ';
  const typeConfig =
    NOTIFICATION_TYPE_CONFIG[item.type] ?? NOTIFICATION_TYPE_CONFIG.DEFAULT;
  const title = item.title?.trim() || 'Thông báo';
  const content = item.content?.trim() || 'Nội dung đang được cập nhật.';

  const createdAt = item.createdAt ? new Date(item.createdAt) : undefined;
  const timeLabel =
    createdAt && !Number.isNaN(createdAt.getTime())
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
      disabled={isRead || !onMarkRead || isMarking}
      activeOpacity={0.85}
      className={`flex-row gap-3 px-4 py-4 ${isRead ? '' : 'bg-blue-50/40'}`}
    >
      <View
        className="mt-0.5 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: typeConfig.bgColor }}
      >
        <MaterialIcons
          name={typeConfig.icon}
          size={20}
          color={typeConfig.color}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`flex-1 text-[14px] leading-[20px] ${
              isRead
                ? 'font-normal text-slate-700'
                : 'font-semibold text-slate-900'
            }`}
            numberOfLines={2}
          >
            {title}
          </Text>
          {!isRead && (
            <View className="mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </View>
        <Text
          className="mt-1 text-[13px] leading-[18px] text-slate-500"
          numberOfLines={3}
        >
          {content}
        </Text>
        <Text className="mt-2 text-[11px] text-slate-400">{timeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function NotificationsScreen() {
  const notificationsQuery = useNotifications({ page: 1, limit: 50 });
  const markOneMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await notificationsQuery.refetch();
  });

  if (notificationsQuery.isLoading)
    return <Loading label="Đang tải thông báo..." />;

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
  const unreadNotifications = notifications.filter(
    (n) => n.status === 'UNREAD',
  );
  const readNotifications = notifications.filter((n) => n.status === 'READ');
  const unreadCount = unreadNotifications.length;

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Thông báo"
        rightSlot={
          unreadCount > 0 ? (
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
          ) : null
        }
      />
      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <MaterialIcons
              name="notifications-none"
              size={36}
              color="#93c5fd"
            />
          </View>
          <Text className="text-base font-bold text-slate-700">
            Chưa có thông báo
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-400">
            Các thông báo về lịch khám và thanh toán sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {unreadCount > 0 && (
            <>
              <View className="border-b border-slate-100 px-4 py-3">
                <Text className="text-[11px] font-bold tracking-[0.8px] text-slate-400">
                  CHƯA ĐỌC
                </Text>
              </View>
              {unreadNotifications.map((item) => (
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

          {readNotifications.length > 0 && (
            <>
              <View className="border-b border-slate-100 px-4 py-3">
                <Text className="text-[11px] font-bold tracking-[0.8px] text-slate-400">
                  ĐÃ ĐỌC
                </Text>
              </View>
              {readNotifications.map((item) => (
                <View key={item.id} className="border-b border-slate-50">
                  <NotificationCard item={item} isMarking={false} />
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
