import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLogout } from '@/hooks/useLogout';
import {
  useNotificationUnreadCount,
  useTestPushNotification,
} from '@/hooks/useNotifications';
import { useMyPatient, useProfile } from '@/hooks/useProfile';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import theme from '@/constants/theme';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

function MenuItem({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
  isLast,
  badge,
  danger,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
  badge?: number;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center gap-3 bg-white px-4 py-[14px] ${
        isLast ? '' : 'border-b border-slate-50'
      }`}
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        <MaterialIcons name={icon as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-[14px] font-semibold ${
            danger ? 'text-red-500' : 'text-slate-900'
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-[12px] text-slate-400">{subtitle}</Text>
        )}
      </View>
      {badge !== undefined && badge > 0 ? (
        <View className="min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-white">{badge}</Text>
        </View>
      ) : (
        <MaterialIcons
          name="chevron-right"
          size={18}
          color={danger ? '#ef4444' : '#cbd5e1'}
        />
      )}
    </TouchableOpacity>
  );
}

function StatItem({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View className="flex-1 items-center gap-1 py-3">
      <MaterialIcons name={icon as any} size={20} color={color} />
      <Text className="text-[17px] font-bold text-slate-900">{value}</Text>
      <Text className="text-[11px] text-slate-400">{label}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const myPatientQuery = useMyPatient();
  const profileQuery = useProfile();
  const testPushMutation = useTestPushNotification();
  const { data: unreadData } = useNotificationUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await Promise.all([
      myPatientQuery.refetch(),
      profileQuery.refetch(),
    ]);
  });

  if (myPatientQuery.isLoading || profileQuery.isLoading) {
    return <Loading label="Đang tải hồ sơ..." />;
  }

  if (myPatientQuery.isError || profileQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải hồ sơ"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const profile = profileQuery.data;
  const patient = myPatientQuery.data;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAvatarPress = async () => {
    if (isUploadingAvatar) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'avatar.jpg',
      } as any);

      const response = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response?.data?.user && user) {
        setUser({ ...user, avatarUrl: response.data.user.avatarUrl });
      }
    } catch (error) {
      console.warn('Avatar upload failed:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-primary pb-8"
        style={{
          paddingBottom: 38,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <ScreenHeader title="Tài khoản" hideBack />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        }}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: -48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* PROFILE CARD */}
        <View
          className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {/* Avatar + info */}
          <View className="items-center px-4 pb-4 pt-6">
            <View className="relative mb-3">
              {user?.avatarUrl ? (
                <View
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 4,
                    borderRadius: 999,
                  }}
                >
                  <Image
                    source={{ uri: user.avatarUrl }}
                    className="h-20 w-20 rounded-full border-4 border-white"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-100">
                  <MaterialIcons name="person" size={36} color="#60a5fa" />
                </View>
              )}
              <TouchableOpacity
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500"
              >
                <MaterialIcons name="camera-alt" size={14} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="text-[17px] font-bold text-slate-900">
              {user?.fullName ?? 'Người dùng'}
            </Text>
            <Text className="mt-0.5 text-[13px] text-slate-400">
              Mã BN: {patient?.profileCode ?? '—'}
            </Text>
          </View>

          {/* Stats row */}
          <View className="mx-4 mb-4 flex-row rounded-[14px] bg-slate-50">
            <StatItem
              icon="folder-open"
              value={profile?.summary.totalMedicalRecords ?? 0}
              label="Hồ sơ"
              color="#0A7CFF"
            />
            <View className="my-2 w-px self-stretch bg-slate-200" />
            <StatItem
              icon="medication"
              value={profile?.summary.totalPrescriptions ?? 0}
              label="Đơn thuốc"
              color="#16a34a"
            />
            <View className="my-2 w-px self-stretch bg-slate-200" />
            <StatItem
              icon="monitor-heart"
              value={profile?.summary.totalVitalSigns ?? 0}
              label="Chỉ số"
              color="#d97706"
            />
          </View>
        </View>

        {/* ── MENU: Y TẾ ── */}
        <View className="mx-4 mt-5">
          <Text className="mb-2 px-1 text-[11px] font-bold tracking-[0.8px] text-slate-400">
            Hồ sơ bệnh án
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <MenuItem
              icon="folder-open"
              iconColor="#0A7CFF"
              iconBg="#EFF6FF"
              title="Hồ sơ bệnh án"
              subtitle="Xem hồ sơ và lịch sử khám"
              onPress={() => router.push('/medical-records')}
            />
            <MenuItem
              icon="medication"
              iconColor="#16a34a"
              iconBg="#F0FDF4"
              title="Đơn thuốc"
              subtitle="Lịch sử kê đơn thuốc"
              onPress={() => router.push('/prescriptions')}
              isLast
            />
          </View>
        </View>

        {/* ── MENU: TIỆN ÍCH ── */}
        <View className="mx-4 mt-4">
          <Text className="mb-2 px-1 text-[11px] font-bold tracking-[0.8px] text-slate-400">
            TIỆN ÍCH
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <MenuItem
              icon="edit"
              iconColor="#0A7CFF"
              iconBg="#EFF6FF"
              title="Chỉnh sửa hồ sơ"
              subtitle="Cập nhật thông tin cá nhân"
              onPress={() => router.push('/edit-profile')}
            />
            <MenuItem
              icon="favorite"
              iconColor="#ef4444"
              iconBg="#FEF2F2"
              title="Danh sách yêu thích"
              subtitle="Bác sĩ và bệnh viện đã lưu"
              onPress={() => router.push('/favorites')}
            />
            <MenuItem
              icon="rate-review"
              iconColor="#4F46E5"
              iconBg="#EEF2FF"
              title="Đánh giá của tôi"
              subtitle="Xem lịch sử đánh giá bác sĩ"
              onPress={() => router.push('/my-reviews')}
            />
            <MenuItem
              icon="calendar-today"
              iconColor="#4F46E5"
              iconBg="#EEF2FF"
              title="Lịch khám"
              subtitle="Quản lý lịch khám của bạn"
              onPress={() => router.push('/(tabs)/appointments')}
            />
            <MenuItem
              icon="chat-bubble"
              iconColor="#0891b2"
              iconBg="#ECFEFF"
              title="Tin nhắn"
              subtitle="Chat với bác sĩ"
              onPress={() => router.push('/(tabs)/chat')}
            />
            <MenuItem
              icon="notifications"
              iconColor="#d97706"
              iconBg="#FFFBEB"
              title="Thông báo"
              subtitle="Cập nhật từ hệ thống"
              badge={unreadCount}
              onPress={() => router.push('/notifications')}
            />
            <MenuItem
              icon="notifications-active"
              iconColor="#10b981"
              iconBg="#ecfdf5"
              title="Test Push Notification"
              subtitle="Gửi thông báo thử nghiệm"
              onPress={async () => {
                try {
                  await testPushMutation.mutateAsync({
                    title: '🔔 Thông báo thử nghiệm',
                    content:
                      'Đây là nội dung thử nghiệm từ hệ thống Mobile App.',
                  });
                } catch (error) {
                  console.warn('Test push failed:', error);
                }
              }}
              isLast
            />
          </View>
        </View>

        {/* ── MENU: HỖ TRỢ ── */}
        <View className="mx-4 mt-4">
          <Text className="mb-2 px-1 text-[11px] font-bold tracking-[0.8px] text-slate-400">
            HỖ TRỢ
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <MenuItem
              icon="flag"
              iconColor="#7c3aed"
              iconBg="#F5F3FF"
              title="Báo cáo của tôi"
              subtitle="Theo dõi phản ánh đã gửi"
              onPress={() => router.push('/reports')}
            />
            <MenuItem
              icon="report-problem"
              iconColor="#dc2626"
              iconBg="#FEF2F2"
              title="Gửi báo cáo"
              subtitle="Báo cáo bác sĩ hoặc lịch khám"
              onPress={() => router.push('/reports/new')}
            />
            <MenuItem
              icon="settings"
              iconColor="#64748b"
              iconBg="#F8FAFC"
              title="Cài đặt"
              subtitle="Tuỳ chỉnh tài khoản"
              onPress={() => router.push('/settings')}
              isLast
            />
          </View>
        </View>

        {/* ── ĐĂNG XUẤT ── */}
        <View className="mx-4 mt-4">
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <MenuItem
              icon="logout"
              iconColor="#ef4444"
              iconBg="#FEF2F2"
              title={isLoggingOut ? 'Đang xử lý...' : 'Đăng xuất'}
              subtitle="Kết thúc phiên đăng nhập"
              onPress={handleLogout}
              isLast
              danger
            />
          </View>
        </View>

        {/* App version */}
        <Text className="mt-6 text-center text-[11px] text-slate-300">
          DuTu Pulmo • Phiên bản 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

export default ProfileScreen;
