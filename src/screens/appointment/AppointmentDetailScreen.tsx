import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  APPOINTMENT_STATUS_CONFIG,
  FALLBACK_APPOINTMENT_STATUS,
} from '@/constants/status-configs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function QrCodeBox({ value }: { value: string }) {
  return (
    <View className="my-4 items-center">
      <QRCode value={value} size={200} backgroundColor="white" color="black" />
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

export function AppointmentDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [patientExpanded, setPatientExpanded] = useState(false);

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
    if (!reason) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do hủy.');
      return;
    }
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
    APPOINTMENT_STATUS_CONFIG[appointment.status] ??
    FALLBACK_APPOINTMENT_STATUS;
  const isPendingPayment = appointment.status === 'PENDING_PAYMENT';
  const isCancelled = appointment.status === 'CANCELLED';
  const canJoinVideo = ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(
    appointment.status,
  );
  const isVideoAppointment = appointment.appointmentType === 'VIDEO';

  const PATIENT_CANCEL_BEFORE_MINUTES = 4 * 60; // 240 phút
  const scheduledAt = new Date(appointment.scheduledAt);
  const now = new Date();
  const minutesUntilStart =
    (scheduledAt.getTime() - now.getTime()) / (1000 * 60);

  const isPendingStatus = ['PENDING', 'PENDING_PAYMENT'].includes(
    appointment.status,
  );
  const isConfirmed = appointment.status === 'CONFIRMED';
  const canCancelConfirmed =
    isConfirmed && minutesUntilStart >= PATIENT_CANCEL_BEFORE_MINUTES;
  const canCancel = isPendingStatus || canCancelConfirmed;

  const showCancelWarning =
    isConfirmed &&
    minutesUntilStart < PATIENT_CANCEL_BEFORE_MINUTES + 60 &&
    minutesUntilStart >= PATIENT_CANCEL_BEFORE_MINUTES;

  const hoursUntilDeadline = Math.floor(
    (minutesUntilStart - PATIENT_CANCEL_BEFORE_MINUTES) / 60,
  );
  const minutesUntilDeadline = Math.floor(
    (minutesUntilStart - PATIENT_CANCEL_BEFORE_MINUTES) % 60,
  );

  const scheduledDate = new Date(appointment.scheduledAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const fallback = '—';
  const patientUser = myPatient?.user;
  const patientCode = myPatient?.profileCode ?? fallback;
  const displayName =
    patientUser?.fullName ?? currentUser?.fullName ?? fallback;
  const displayPhone = patientUser?.phone ?? fallback;
  const displayEmail = patientUser?.email ?? fallback;
  const displayCCCD = patientUser?.CCCD ?? fallback;
  const displayDob = patientUser?.dateOfBirth
    ? new Date(`${patientUser.dateOfBirth}`).toLocaleDateString('vi-VN')
    : fallback;
  const displayGender =
    ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<string, string>)[
      patientUser?.gender ?? ''
    ] ?? fallback;
  const displayNationality = patientUser?.nationality ?? fallback;
  const displayEthnicity = patientUser?.ethnicity ?? fallback;
  const displayOccupation = patientUser?.occupation ?? fallback;
  const displayAddress = patientUser?.address ?? fallback;
  const displayWard = patientUser?.ward ?? fallback;
  const displayProvince = patientUser?.province ?? fallback;

  return (
    <>
      <View className="flex-1 bg-slate-50">
        <ScreenHeader
          title="Phiếu khám"
          rightSlot={
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="rounded-full p-1"
            >
              <MaterialIcons name="ios-share" size={22} color="white" />
            </TouchableOpacity>
          }
        />

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
                  isLast={!patientExpanded}
                />
                {patientExpanded && (
                  <>
                    <InfoLine label="Email" value={displayEmail} />
                    <InfoLine label="CCCD" value={displayCCCD} />
                    <InfoLine label="Giới tính" value={displayGender} />
                    <InfoLine label="Ngày sinh" value={displayDob} />
                    <InfoLine label="Quốc tịch" value={displayNationality} />
                    <InfoLine label="Dân tộc" value={displayEthnicity} />
                    <InfoLine label="Nghề nghiệp" value={displayOccupation} />
                    <InfoLine label="Địa chỉ chi tiết" value={displayAddress} />
                    <InfoLine label="Phường/Xã" value={displayWard} />
                    <InfoLine
                      label="Tỉnh/Thành"
                      value={displayProvince}
                      isLast
                    />
                  </>
                )}
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
              {chatLoading ? 'Đang mở...' : 'Nhắn tin với bác sĩ '}
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
          className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 16),
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
          ) : isPendingPayment ? (
            <View className="gap-2">
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/appointments/payment?appointmentId=${appointmentId}`,
                  )
                }
                activeOpacity={0.85}
                className="flex-row items-center justify-center gap-2 rounded-[14px] bg-amber-500 py-[15px]"
              >
                <MaterialIcons name="payment" size={18} color="white" />
                <Text className="text-[15px] font-bold text-white">
                  Thanh toán ngay
                </Text>
              </TouchableOpacity>

              {canCancel && (
                <TouchableOpacity
                  onPress={() => setCancelModalOpen(true)}
                  activeOpacity={0.85}
                  className="items-center justify-center rounded-[14px] border border-red-500 py-[14px]"
                  style={{ borderWidth: 1.5 }}
                >
                  <Text className="text-[15px] font-bold text-red-500">
                    Hủy lịch
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : isVideoAppointment ? (
            <View className="gap-2">
              {/* 1. Warning (nếu có) */}
              {isConfirmed && !canCancelConfirmed && !isCancelled && (
                <View className="flex-row items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                  <MaterialIcons
                    name="schedule"
                    size={15}
                    color="#f97316"
                    style={{ marginTop: 1 }}
                  />
                  <Text className="flex-1 text-xs leading-[18px] text-orange-700">
                    Đã quá thời hạn hủy lịch (trước 4 tiếng).
                  </Text>
                </View>
              )}

              {showCancelWarning && (
                <View className="flex-row items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">
                  <MaterialIcons
                    name="warning-amber"
                    size={15}
                    color="#d97706"
                    style={{ marginTop: 1 }}
                  />
                  <Text className="flex-1 text-xs leading-[18px] text-yellow-800">
                    Còn{' '}
                    <Text className="font-bold">
                      {hoursUntilDeadline > 0
                        ? `${hoursUntilDeadline}h ${minutesUntilDeadline}p`
                        : `${minutesUntilDeadline} phút`}
                    </Text>{' '}
                    để hủy lịch này.
                  </Text>
                </View>
              )}

              {/* 2. Nút hủy (nếu được phép) */}
              {canCancel && (
                <TouchableOpacity
                  onPress={() => setCancelModalOpen(true)}
                  activeOpacity={0.85}
                  className="items-center justify-center rounded-[14px] border border-red-500 py-[14px]"
                  style={{ borderWidth: 1.5 }}
                >
                  <Text className="text-[15px] font-bold text-red-500">
                    Hủy lịch
                  </Text>
                </TouchableOpacity>
              )}

              {/* 3. Action chính — join video / đánh giá */}
              {canJoinVideo && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/video-call',
                      params: { appointmentId },
                    })
                  }
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center gap-2 rounded-[14px] bg-blue-500 py-[15px]"
                >
                  <MaterialIcons name="video-call" size={18} color="white" />
                  <Text className="text-[15px] font-bold text-white">
                    Vào video call
                  </Text>
                </TouchableOpacity>
              )}

              {appointment.status === 'COMPLETED' && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/appointments/review',
                      params: { appointmentId },
                    })
                  }
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center gap-2 rounded-[14px] bg-blue-600 py-[15px]"
                >
                  <MaterialIcons name="rate-review" size={18} color="white" />
                  <Text className="text-[15px] font-bold text-white">
                    Đánh giá bác sĩ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* Nhánh IN_CLINIC — tương tự */
            <View className="gap-2">
              {/* 1. Warning (nếu có) */}
              {isConfirmed && !canCancelConfirmed && !isCancelled && (
                <View className="flex-row items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                  <MaterialIcons
                    name="schedule"
                    size={15}
                    color="#f97316"
                    style={{ marginTop: 1 }}
                  />
                  <Text className="flex-1 text-xs leading-[18px] text-orange-700">
                    Đã quá thời hạn hủy lịch (trước 4 tiếng).
                  </Text>
                </View>
              )}

              {showCancelWarning && (
                <View className="flex-row items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">
                  <MaterialIcons
                    name="warning-amber"
                    size={15}
                    color="#d97706"
                    style={{ marginTop: 1 }}
                  />
                  <Text className="flex-1 text-xs leading-[18px] text-yellow-800">
                    Còn{' '}
                    <Text className="font-bold">
                      {hoursUntilDeadline > 0
                        ? `${hoursUntilDeadline}h ${minutesUntilDeadline}p`
                        : `${minutesUntilDeadline} phút`}
                    </Text>{' '}
                    để hủy lịch này.
                  </Text>
                </View>
              )}

              {/* 2. Nút hủy (nếu được phép) */}
              {canCancel && (
                <TouchableOpacity
                  onPress={() => setCancelModalOpen(true)}
                  activeOpacity={0.85}
                  className="items-center justify-center rounded-[14px] border border-red-500 py-[14px]"
                  style={{ borderWidth: 1.5 }}
                >
                  <Text className="text-[15px] font-bold text-red-500">
                    Hủy lịch
                  </Text>
                </TouchableOpacity>
              )}

              {/* 3. Action chính — đánh giá */}
              {appointment.status === 'COMPLETED' && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/appointments/review',
                      params: { appointmentId },
                    })
                  }
                  activeOpacity={0.85}
                  className="flex-row items-center justify-center gap-2 rounded-[14px] bg-blue-600 py-[15px]"
                >
                  <MaterialIcons name="rate-review" size={18} color="white" />
                  <Text className="text-[15px] font-bold text-white">
                    Đánh giá bác sĩ
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
