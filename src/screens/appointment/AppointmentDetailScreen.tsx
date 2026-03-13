import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from "react-native-qrcode-svg";

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import {
  useAppointmentDetail,
  useCancelAppointment,
} from '@/hooks/useAppointments';
import { useMyPatient } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/auth.store';
import { chatService } from '@/services/chat.service';

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

// ─── Copy button ──────────────────────────────────────────────────────────────
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

// Status badge config
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
  }
> = {
  CONFIRMED: {
    label: 'Đã đặt lịch',
    icon: 'check-circle',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
  PENDING: {
    label: 'Chờ xác nhận',
    icon: 'schedule',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    icon: 'payment',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    icon: 'done-all',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    icon: 'cancel',
    color: '#ef4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-500',
  },
  CHECKED_IN: {
    label: 'Đã check-in',
    icon: 'how-to-reg',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    icon: 'medical-services',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  RESCHEDULED: {
    label: 'Đã đổi lịch',
    icon: 'event-repeat',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
};

// ── InfoLine ──────────────────────────────────────────────────────────────────
function InfoLine({
  label,
  value,
  copyable,
  highlight,
  isLast,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-[11px] ${
        isLast ? '' : 'border-b border-slate-50'
      }`}
    >
      <Text className="text-[13px] text-slate-400">{label}</Text>
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
export function AppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [patientExpanded, setPatientExpanded] = useState(true);

  const detailQuery = useAppointmentDetail(appointmentId);
  const cancelMutation = useCancelAppointment();
  const myPatientQuery = useMyPatient();

  const handleShare = async () => {
    const a = detailQuery.data;
    if (!a) return;
    try {
      await Share.share({
        message: `Lịch khám:\nMã: ${a.appointmentNumber}\nBác sĩ: ${a.doctor?.fullName}\nNgày: ${new Date(a.scheduledAt).toLocaleDateString('vi-VN')}`,
      });
    } catch {}
  };

  const handleChat = async () => {
    const a = detailQuery.data;
    if (!currentUser?.id || !a?.doctor?.userId) return;
    try {
      setChatLoading(true);
      const room = await chatService.createOrGetRoom({
        user1Id: currentUser.id,
        user2Id: a.doctor.userId,
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

  const onConfirmCancel = () => {
    cancelMutation.mutate(
      {
        appointmentId,
        payload: { reason: reason || 'Patient requested cancellation' },
      },
      {
        onSuccess: () => {
          setCancelModalOpen(false);
          void detailQuery.refetch();
        },
      },
    );
  };

  if (detailQuery.isLoading) return <Loading label="Đang tải phiếu khám..." />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-6">
        <EmptyState
          title="Không tìm thấy phiếu khám"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const appointment = detailQuery.data;
  const doctor = appointment.doctor;
  const myPatient = myPatientQuery.data;

  const statusConfig =
    STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG['PENDING'];
  const canCancel = ['PENDING', 'CONFIRMED', 'PENDING_PAYMENT'].includes(
    appointment.status,
  );
  const isCancelled = appointment.status === 'CANCELLED';

  const scheduledDate = new Date(appointment.scheduledAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const displayPhone = myPatient?.user?.phone ?? '—';
  const patientCode = myPatient?.profileCode ?? '—';
  const displayName = myPatient?.user?.fullName ?? currentUser?.fullName ?? '—';

  return (
    <>
      <View className="flex-1 bg-slate-50">
        {/* HEADER */}
        <View className="flex-row items-center justify-between bg-blue-500 px-4 pb-4 pt-12">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="rounded-full p-1"
          >
            <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Phiếu khám</Text>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.7}
            className="rounded-full p-1"
          >
            <MaterialIcons name="ios-share" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-[120px]"
          showsVerticalScrollIndicator={false}
        >
          {/* ── QR CARD ── */}
          <View className="overflow-hidden rounded-[20px] bg-white shadow-sm">
            {/* Doctor name + QR */}
            <View className="items-center px-5 pt-5">
              <Text className="text-base font-bold uppercase tracking-wide text-slate-900">
                {doctor?.fullName ?? 'Bác sĩ'}
              </Text>
              <QrCodeBox value={appointment.appointmentNumber} />
            </View>

            {/* Status badge */}
            <View className="px-5 pb-4">
              <View
                className={`flex-row items-center gap-2 ${statusConfig.bgClass} border ${statusConfig.borderClass} rounded-[10px] px-[14px] py-[10px]`}
              >
                <MaterialIcons
                  name={statusConfig.icon as any}
                  size={18}
                  color={statusConfig.color}
                />
                <Text
                  className={`flex-1 text-sm font-semibold ${statusConfig.textClass}`}
                >
                  {statusConfig.label}
                </Text>
              </View>

              {/* Cancelled message */}
              {isCancelled && (
                <Text className="mt-2 text-xs leading-[18px] text-orange-400">
                  Đã huỷ. Lịch khám đã được huỷ bởi Bạn. Để được hỗ trợ vui lòng
                  liên hệ{' '}
                  <Text
                    className="font-bold underline"
                    onPress={() => Linking.openURL('tel:19002805')}
                  >
                    1900-2805
                  </Text>
                </Text>
              )}
            </View>

            {/* Divider dashed */}
            <View
              className="mx-4 mb-4"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#e2e8f0',
                borderStyle: 'dashed',
              }}
            />

            {/* Appointment codes */}
            <View className="px-5 pb-4">
              <View className="flex-row items-center justify-between border-b border-slate-50 py-[10px]">
                <Text className="text-[13px] text-slate-400">
                  Mã phiếu khám
                </Text>
                <CopyText text={appointment.appointmentNumber ?? '—'} />
              </View>
              <View className="flex-row items-center justify-between py-[10px]">
                <Text className="text-[13px] text-slate-400">Ngày khám</Text>
                <Text className="text-sm font-semibold text-slate-900">
                  {`${weekdays[scheduledDate.getDay()]}, ${scheduledDate.toLocaleDateString('vi-VN')}`}
                </Text>
              </View>
            </View>
          </View>

          {/* ── PATIENT INFO ── */}
          <View className="mt-4">
            <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
              Thông tin bệnh nhân
            </Text>
            <View className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <View className="p-4">
                <InfoLine
                  label="Mã bệnh nhân"
                  value={patientCode}
                  copyable
                  highlight
                />
                <InfoLine label="Họ và tên" value={displayName} />
                <InfoLine
                  label="Số điện thoại"
                  value={displayPhone}
                  copyable
                  isLast
                />
              </View>
              <Pressable
                onPress={() => setPatientExpanded(!patientExpanded)}
                className="items-center border-t border-slate-100 py-3"
              >
                <Text className="text-sm font-medium text-blue-500">
                  {patientExpanded ? 'Thu gọn' : 'Chi tiết'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── APPOINTMENT INFO ── */}
          <View className="mt-4">
            <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
              Thông tin đăng ký khám
            </Text>
            <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <View className="h-14 w-14 overflow-hidden rounded-full bg-blue-100">
                {doctor?.avatarUrl ? (
                  <Image
                    source={{ uri: doctor.avatarUrl }}
                    className="h-14 w-14"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialIcons name="person" size={28} color="#60a5fa" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold uppercase text-slate-900">
                  {doctor?.fullName ?? 'Bác sĩ'}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  {scheduledDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── CHAT BUTTON ── */}
          <TouchableOpacity
            onPress={handleChat}
            disabled={chatLoading || isCancelled}
            activeOpacity={0.85}
            className={`mt-4 flex-row items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 py-[14px] ${
              isCancelled ? 'opacity-50' : ''
            }`}
          >
            <MaterialIcons name="chat-bubble" size={18} color="#0A7CFF" />
            <Text className="text-sm font-semibold text-blue-500">
              {chatLoading ? 'Đang mở...' : 'Nhắn tin với bác sĩ'}
            </Text>
          </TouchableOpacity>

          {/* Tổng đài hỗ trợ */}
          {isCancelled && (
            <View className="mt-4 items-center">
              <Text className="text-xs text-slate-400">
                Tổng đài hỗ trợ chăm sóc khách hàng
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL('tel:19002805')}
                className="mt-1"
              >
                <Text className="text-base font-bold text-blue-500">
                  1900-2805
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* FIXED BOTTOM BUTTON */}
        <View
          className={`absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3 ${
            Platform.OS === 'ios' ? 'pb-9' : 'pb-4'
          }`}
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 8,
            elevation: 16,
          }}
        >
          {isCancelled ? (
            <TouchableOpacity
              onPress={() => router.push('/doctors')}
              activeOpacity={0.85}
              className="flex-row items-center justify-center gap-2 rounded-[14px] bg-blue-500 py-[15px]"
            >
              <MaterialIcons name="calendar-month" size={18} color="white" />
              <Text className="text-[15px] font-bold text-white">
                Đặt lịch khám khác
              </Text>
            </TouchableOpacity>
          ) : canCancel ? (
            <TouchableOpacity
              onPress={() => setCancelModalOpen(true)}
              activeOpacity={0.85}
              className="items-center justify-center rounded-[14px] border border-red-500 py-[15px]"
              style={{ borderWidth: 1.5 }}
            >
              <Text className="text-[15px] font-bold text-red-500">
                Huỷ lịch
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* CANCEL MODAL */}
      <Modal
        visible={cancelModalOpen}
        onRequestClose={() => setCancelModalOpen(false)}
      >
        <View className="m-5 rounded-[20px] bg-white p-5 shadow-lg">
          <View className="mb-4 items-center">
            <View className="mb-[10px] h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <MaterialIcons name="event-busy" size={24} color="#ef4444" />
            </View>
            <Text className="text-[17px] font-bold text-slate-900">
              Huỷ lịch khám?
            </Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-gray-500">
              Lịch khám của bạn sẽ bị huỷ. Vui lòng cung cấp lý do huỷ.
            </Text>
          </View>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Nhập lý do huỷ lịch..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            className="min-h-[80px] rounded-xl border border-gray-200 bg-gray-50 px-[14px] py-3 text-sm text-slate-900"
            style={{ textAlignVertical: 'top' }}
          />

          <View className="mt-4 flex-row gap-[10px]">
            <TouchableOpacity
              onPress={() => setCancelModalOpen(false)}
              className="flex-1 items-center rounded-xl border border-gray-200 py-[13px]"
              activeOpacity={0.8}
            >
              <Text className="font-semibold text-gray-700">Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirmCancel}
              disabled={cancelMutation.isPending}
              className={`flex-1 items-center rounded-xl py-[13px] ${
                cancelMutation.isPending ? 'bg-red-300' : 'bg-red-500'
              }`}
              activeOpacity={0.8}
            >
              <Text className="font-bold text-white">
                {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận huỷ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default AppointmentDetailScreen;
