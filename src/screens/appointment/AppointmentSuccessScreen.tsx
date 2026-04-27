import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from "react-native-qrcode-svg";

import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepBar } from '@/components/appointment/StepBar';
import { SupportItem } from '@/components/appointment/SupportItem';
import { useAppointmentDetail } from '@/hooks/useAppointments';
import { useMyPatient } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';
import { chatService } from '@/services/chat.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── QR Code  ──────────────────────────────────────────────────────
function QrCodeBox({ value }: { value: string }) {
  return (
    <View className="my-4 items-center">
      <QRCode
        value={value}
        size={200}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
}

function CopyText({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <TouchableOpacity
      onPress={onCopy}
      className="flex-row items-center gap-1"
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-semibold text-slate-900 ${className ?? ''}`}
      >
        {text}
      </Text>
      <MaterialIcons
        name={copied ? 'check' : 'content-copy'}
        size={14}
        color={copied ? '#22c55e' : '#94a3b8'}
      />
    </TouchableOpacity>
  );
}

// Dashed separator
function DashedDivider() {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        borderStyle: 'dashed',
      }}
    />
  );
}

// ── InfoLine ──────────────────────────────────────────────────────────────────
function InfoLine({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-50 py-[10px]">
      <Text className="text-[13px] text-gray-500">{label}</Text>
      {copyable ? (
        <CopyText
          text={value}
          className={highlight ? 'text-blue-500' : 'text-slate-900'}
        />
      ) : (
        <Text
          className={`text-sm font-semibold ${highlight ? 'text-blue-500' : 'text-slate-900'}`}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function AppointmentSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const user = useAuthStore((s) => s.user);

  const [patientInfoExpanded, setPatientInfoExpanded] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const detailQuery = useAppointmentDetail(appointmentId);
  const myPatientQuery = useMyPatient();

  const appointment = detailQuery.data;
  const myPatient = myPatientQuery.data;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Lịch khám của tôi:\nMã: ${appointment?.appointmentNumber}\nBác sĩ: ${appointment?.doctor?.fullName}\nNgày: ${appointment?.scheduledAt ? new Date(appointment.scheduledAt).toLocaleDateString('vi-VN') : ''}`,
      });
    } catch {}
  };

  const handleChat = async () => {
    if (!user?.id || !appointment?.doctor?.userId) return;
    try {
      setChatLoading(true);
      const room = await chatService.createOrGetRoom({
        user1Id: user.id,
        user2Id: appointment.doctor.userId,
      });
      router.push({
        pathname: '/chat/[chatroomId]',
        params: { chatroomId: room.id },
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể mở chat. Vui lòng thử lại.');
    } finally {
      setChatLoading(false);
    }
  };

  if (detailQuery.isLoading)
    return <Loading label="Đang tải kết quả đặt lịch..." />;

  if (detailQuery.isError || !appointment) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <EmptyState
          title="Không tìm thấy lịch khám"
          description="Vui lòng kiểm tra trong mục Lịch khám."
        />
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/appointments')}
          className="mt-5 rounded-xl bg-blue-500 px-6 py-3"
        >
          <Text className="font-bold text-white">Xem lịch khám</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doctor = appointment.doctor;
  const scheduledDate = new Date(appointment.scheduledAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dateLabel = `${weekdays[scheduledDate.getDay()]}, ${scheduledDate.toLocaleDateString('vi-VN')}`;
  const createdAtLabel = (() => {
    const d = new Date(appointment.createdAt ?? appointment.scheduledAt);
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
  })();

  const displayName = user?.fullName ?? '—';
  const displayPhone = myPatient?.user?.phone ?? '—';
  const displayDOB = myPatient?.user?.dateOfBirth
    ? new Date(`${myPatient.user.dateOfBirth}T00:00:00`).toLocaleDateString(
        'vi-VN',
      )
    : '—';
  const displayGender = (() => {
    const g = myPatient?.user?.gender;
    return (
      ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<string, string>)[
        g ?? ''
      ] ?? '—'
    );
  })();
  const patientCode = myPatient?.profileCode ?? '—';

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Kết quả đặt lịch"
        onBack={() => router.replace('/(tabs)/home')}
        rightSlot={
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7} className="rounded-full p-1">
            <MaterialIcons name="ios-share" size={22} color="white" />
          </TouchableOpacity>
        }
      />

      {/* STEP BAR */}
      <StepBar current={4} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SUCCESS BADGE ── */}
        <View className="items-center pb-2 pt-6">
          <View
            className="h-14 w-14 items-center justify-center rounded-full bg-green-500"
            style={{
              shadowColor: '#22c55e',
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <MaterialIcons name="check" size={32} color="white" />
          </View>
          <Text className="mt-[10px] text-[17px] font-bold text-green-500">
            Đã đặt lịch
          </Text>
          <Text className="mt-1 text-xs text-slate-400">{createdAtLabel}</Text>
        </View>

        {/* ── QR CARD ── */}
        <View className="mx-4 mt-2">
          <View className="overflow-hidden rounded-[20px] bg-white pb-0 pt-2 shadow-sm">
            {/* QR Code */}
            <QrCodeBox value={appointment.appointmentNumber ?? 'DT2026'} />

            <DashedDivider />

            {/* Doctor row */}
            <View className="flex-row items-center gap-3 border-b border-slate-50 px-5 py-4">
              <View className="h-12 w-12 overflow-hidden rounded-full bg-blue-100">
                {doctor?.avatarUrl ? (
                  <Image
                    source={{ uri: doctor.avatarUrl }}
                    className="h-12 w-12"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialIcons name="person" size={24} color="#60a5fa" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-gray-500">Bác sĩ</Text>
                <Text className="text-[15px] font-bold uppercase text-slate-900">
                  {doctor?.fullName ?? 'Bác sĩ'}
                </Text>
              </View>
            </View>

            {/* Appointment info */}
            <View className="px-5">
              <View className="flex-row items-center justify-between border-b border-slate-50 py-[10px]">
                <Text className="text-[13px] text-gray-500">Mã lịch khám</Text>
                <CopyText text={appointment.appointmentNumber ?? '—'} />
              </View>
              <View className="flex-row items-center justify-between py-[10px]">
                <Text className="text-[13px] text-gray-500">Ngày khám</Text>
                <Text className="text-sm font-semibold text-slate-900">
                  {dateLabel}
                </Text>
              </View>
            </View>

            <DashedDivider />

            {/* Patient info — collapsible */}
            <Pressable
              onPress={() => setPatientInfoExpanded(!patientInfoExpanded)}
              className="flex-row items-center px-5 py-3"
            >
              <Text className="flex-1 text-[11px] font-bold tracking-[0.8px] text-slate-400">
                THÔNG TIN BỆNH NHÂN
              </Text>
              <View className="mr-2 h-[1px] flex-1 bg-slate-200" />
              <MaterialIcons
                name={patientInfoExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color="#94a3b8"
              />
            </Pressable>

            {patientInfoExpanded && (
              <View className="px-5 pb-4">
                <InfoLine
                  label="Mã bệnh nhân"
                  value={patientCode}
                  copyable
                  highlight
                />
                <InfoLine label="Họ và tên" value={displayName} />
                <InfoLine label="Ngày sinh" value={displayDOB} />
                <InfoLine label="Giới tính" value={displayGender} />
                <View className="flex-row items-center justify-between py-[10px]">
                  <Text className="text-[13px] text-gray-500">
                    Số điện thoại
                  </Text>
                  <CopyText text={displayPhone} />
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/appointments/${appointmentId}`)}
                  className="mt-2 items-center py-1.5"
                >
                  <Text className="text-sm font-medium text-blue-500">
                    Xem chi tiết
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* ── HỖ TRỢ ── */}
        <View className="mx-4 mt-5">
          <Text className="mb-2 text-sm font-medium text-gray-700">
            Thông tin hỗ trợ đặt khám
          </Text>
          <View className="rounded-2xl bg-white px-4 shadow-sm">
            <SupportItem icon="chat-bubble-outline" label="Chat với CSKH" />
            <SupportItem icon="description" label="Hướng dẫn đặt khám" />
            <SupportItem icon="payment" label="Hướng dẫn thanh toán" />
            <SupportItem icon="sync" label="Quy trình huỷ lịch / hoàn tiền" />
            <SupportItem
              icon="help-outline"
              label="Một số câu hỏi thường gặp"
            />
            <View className="border-b-0">
              <SupportItem icon="report-problem" label="Báo cáo sự cố" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM BUTTONS */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t border-slate-100 bg-white px-4 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 16),
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          activeOpacity={0.85}
          className="flex-1 items-center justify-center rounded-[14px] border border-slate-200 py-[14px]"
          style={{ borderWidth: 1.5 }}
        >
          <Text className="text-sm font-semibold text-gray-700">
            Về trang chủ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleChat}
          disabled={chatLoading}
          activeOpacity={0.85}
          className={`flex-[1.4] flex-row items-center justify-center gap-1.5 rounded-[14px] py-[14px] ${
            chatLoading ? 'bg-blue-300' : 'bg-blue-500'
          }`}
          style={{
            shadowColor: '#0A7CFF',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="chat-bubble" size={18} color="white" />
          <Text className="text-sm font-bold text-white">
            {chatLoading ? 'Đang mở...' : 'Chat với bác sĩ'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default AppointmentSuccessScreen;

