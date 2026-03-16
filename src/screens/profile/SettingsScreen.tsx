import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '@/store/auth.store';

// ─── Toggle item ──────────────────────────────────────────────────────────────
function SettingRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  value,
  isLast,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  value?: string;
  isLast?: boolean;
}) {
  return (
    <View
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
        <Text className="text-[14px] font-semibold text-slate-900">{title}</Text>
        {subtitle && (
          <Text className="mt-0.5 text-[12px] text-slate-400">{subtitle}</Text>
        )}
      </View>
      {value && <Text className="text-[13px] text-slate-400">{value}</Text>}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function SettingsScreen() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View className="flex-row items-center gap-3 bg-blue-500 px-4 pb-4 pt-12">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Cài đặt</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── THÔNG TIN ỨNG DỤNG ── */}
        <View className="mt-5 mx-4">
          <Text className="mb-2 text-[11px] font-bold tracking-[0.8px] text-slate-400 px-1">
            THÔNG TIN ỨNG DỤNG
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <SettingRow
              icon="smartphone"
              iconColor="#0A7CFF"
              iconBg="#EFF6FF"
              title="Phiên bản"
              value="1.0.0"
            />
            <SettingRow
              icon="language"
              iconColor="#16a34a"
              iconBg="#F0FDF4"
              title="Ngôn ngữ"
              value="Tiếng Việt"
            />
            <SettingRow
              icon="light-mode"
              iconColor="#d97706"
              iconBg="#FFFBEB"
              title="Giao diện"
              value="Sáng"
              isLast
            />
          </View>
        </View>

        {/* ── QUYỀN RIÊNG TƯ ── */}
        <View className="mt-4 mx-4">
          <Text className="mb-2 text-[11px] font-bold tracking-[0.8px] text-slate-400 px-1">
            QUYỀN RIÊNG TƯ & BẢO MẬT
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <SettingRow
              icon="lock"
              iconColor="#7c3aed"
              iconBg="#F5F3FF"
              title="Bảo mật tài khoản"
              subtitle="Đổi mật khẩu, xác thực 2 bước"
            />
            <SettingRow
              icon="privacy-tip"
              iconColor="#0891b2"
              iconBg="#ECFEFF"
              title="Chính sách quyền riêng tư"
              subtitle="Xem cách chúng tôi bảo vệ dữ liệu"
              isLast
            />
          </View>
        </View>

        {/* ── THÔNG BÁO ── */}
        <View className="mt-4 mx-4">
          <Text className="mb-2 text-[11px] font-bold tracking-[0.8px] text-slate-400 px-1">
            THÔNG BÁO
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <SettingRow
              icon="notifications"
              iconColor="#d97706"
              iconBg="#FFFBEB"
              title="Thông báo đẩy"
              subtitle="Nhận thông báo về lịch khám"
            />
            <SettingRow
              icon="mail"
              iconColor="#dc2626"
              iconBg="#FEF2F2"
              title="Thông báo email"
              subtitle="Nhận xác nhận qua email"
              isLast
            />
          </View>
        </View>

        {/* ── HỖ TRỢ ── */}
        <View className="mt-4 mx-4">
          <Text className="mb-2 text-[11px] font-bold tracking-[0.8px] text-slate-400 px-1">
            HỖ TRỢ
          </Text>
          <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <SettingRow
              icon="help-outline"
              iconColor="#64748b"
              iconBg="#F8FAFC"
              title="Trung tâm trợ giúp"
              subtitle="Câu hỏi thường gặp"
            />
            <SettingRow
              icon="description"
              iconColor="#64748b"
              iconBg="#F8FAFC"
              title="Điều khoản sử dụng"
              subtitle="Đọc điều khoản dịch vụ"
              isLast
            />
          </View>
        </View>

        {/* ── ĐĂNG XUẤT ── */}
        <View className="mt-4 mx-4">
          <TouchableOpacity
            onPress={clearSession}
            activeOpacity={0.85}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4"
          >
            <MaterialIcons name="logout" size={18} color="#ef4444" />
            <Text className="text-[15px] font-semibold text-red-500">
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mt-6 items-center">
          <Text className="text-[11px] text-slate-300">
            DuTu Pulmo • © 2025 DuTu Health
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default SettingsScreen;