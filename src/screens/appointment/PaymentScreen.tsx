import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepBar } from '@/components/appointment/StepBar';
import { useAppointmentDetail } from '@/hooks/useAppointments';
import { useCreatePayment, usePaymentStatusOnce } from '@/hooks/usePayment';
import { usePaymentSocket } from '@/hooks/usePaymentSocket';
import QRCode from 'react-native-qrcode-svg';

// ══════════════════════════════════════════════════════════════════════════════
export function PaymentScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{
    appointmentId: string;
  }>();

  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();

  const detailQuery = useAppointmentDetail(appointmentId);
  const appointment = detailQuery.data;

  const createPayment = useCreatePayment();
  const payment = createPayment.data;

  // ── 1. WebSocket: nhận status real-time từ server ─────────────────────
  usePaymentSocket(
    appointmentId,
    useCallback((status) => {
      setPaymentStatus(status);
    }, []),
  );

  // ── 2. Fallback: poll 1 lần duy nhất sau 30s nếu socket miss ─────────
  // Dùng useRef để đảm bảo timer chỉ được set đúng 1 lần,
  // tránh trường hợp re-render reset/chạy timer sớm hơn dự kiến.
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackQuery = usePaymentStatusOnce(appointmentId);

  useEffect(() => {
    // Chỉ bắt đầu đếm khi payment vừa được tạo xong
    // và chưa có timer nào đang chạy
    if (!payment?.id || fallbackTimerRef.current) return;

    fallbackTimerRef.current = setTimeout(() => {
      void fallbackQuery.refetch();
    }, 30_000);

    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.id]);

  // Nếu fallback trả về status khác PENDING thì cập nhật state
  useEffect(() => {
    const s = fallbackQuery.data?.status;
    if (s && s !== 'PENDING') {
      setPaymentStatus(s);
    }
  }, [fallbackQuery.data?.status]);
  // ─────────────────────────────────────────────────────────────────────

  // ── Trigger tạo payment lúc mount (idempotent guard) ──────────────────
  useEffect(() => {
    if (!appointmentId || createPayment.isPending || createPayment.data) return;
    createPayment.mutate(appointmentId, {
      onError: () => {
        Alert.alert(
          'Không thể tạo thanh toán',
          'Vui lòng thử lại hoặc liên hệ hỗ trợ.',
          [{ text: 'Quay lại', onPress: () => router.back() }],
        );
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // ── Navigate to success khi PAID ──────────────────────────────────────
  useEffect(() => {
    if (paymentStatus === 'PAID') {
      router.replace(`/appointments/success?appointmentId=${appointmentId}`);
    }
  }, [paymentStatus, appointmentId, router]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (detailQuery.isLoading || createPayment.isPending) {
    return <Loading label="Đang tạo thanh toán..." />;
  }

  // ── Derived values ─────────────────────────────────────────────────────
  const livePayment = payment;

  const totalAmount = Number(livePayment?.amount ?? 0);
  const formattedAmount =
    totalAmount === 0 ? '0đ' : `${totalAmount.toLocaleString('vi-VN')}đ`;

  const accountNumber = livePayment?.accountNumber;
  const accountName = livePayment?.accountName;
  const description = livePayment?.description;
  const qrCodeData = livePayment?.qrCode;

  const isCancelled =
    paymentStatus === 'CANCELLED' || paymentStatus === 'EXPIRED';

  // ══════════════════════════════════════════════════════════════════════
  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Thanh toán" onBack={() => router.back()} />

      {/* STEP BAR */}
      <StepBar current={3} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-[120px]"
        showsVerticalScrollIndicator={false}
      >
        {/* ── TỔNG THANH TOÁN ── */}
        <View className="px-4 pt-5">
          <View
            className="items-center rounded-[20px] bg-white p-6"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="text-xs font-semibold tracking-[1.2px] text-slate-400">
              TỔNG THANH TOÁN
            </Text>
            <Text className="mt-2 text-[36px] font-extrabold tracking-tight text-blue-500">
              {formattedAmount}
            </Text>

            {appointment && (
              <View className="mt-[14px] w-full flex-row items-center gap-[10px] rounded-xl bg-slate-50 px-[14px] py-[10px]">
                <MaterialIcons name="event" size={18} color="#0A7CFF" />
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-slate-900">
                    {appointment.doctor?.fullName ?? 'Bác sĩ'}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {new Date(appointment.scheduledAt).toLocaleDateString(
                      'vi-VN',
                      {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      },
                    )}
                  </Text>
                </View>
                <View className="rounded-lg bg-blue-50 px-2 py-1">
                  <Text className="text-[11px] font-semibold text-blue-500">
                    #{appointment.appointmentNumber?.slice(-6)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── QR CODE ── */}
        {qrCodeData && !isCancelled && (
          <View className="mt-6 px-4">
            <Text className="mb-[10px] text-[11px] font-bold tracking-[1px] text-slate-400">
              QUÉT QR ĐỂ THANH TOÁN
            </Text>
            <View
              className="items-center rounded-2xl bg-white p-6"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}
            >
              <View className="rounded-xl border border-slate-100 bg-white p-3">
                <QRCode
                  value={livePayment!.qrCode}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>

              {/* Bank Info */}
              <View className="mt-4 w-full space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">Số tài khoản</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {accountNumber}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">Chủ tài khoản</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {accountName}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">Số tiền</Text>
                  <Text className="text-sm font-bold text-blue-500">
                    {formattedAmount}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">Nội dung</Text>
                  <Text className="ml-4 flex-1 text-right text-sm font-semibold text-slate-800">
                    {description}
                  </Text>
                </View>
              </View>

              {/* Socket indicator */}
              <View className="mt-5 flex-row items-center gap-2">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="text-xs text-slate-500">
                  Đang chờ xác nhận thanh toán...
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── CANCELLED / EXPIRED ── */}
        {isCancelled && (
          <View className="mt-6 px-4">
            <View className="items-center rounded-2xl border border-red-100 bg-red-50 p-6">
              <MaterialIcons name="cancel" size={48} color="#ef4444" />
              <Text className="mt-3 text-base font-bold text-red-600">
                {paymentStatus === 'EXPIRED'
                  ? 'Thanh toán đã hết hạn'
                  : 'Thanh toán đã bị huỷ'}
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Vui lòng quay lại và thử lại
              </Text>
            </View>
          </View>
        )}

        {/* ── SECURITY NOTE ── */}
        <View className="mt-5 px-4">
          <View className="flex-row items-start gap-[10px] rounded-[14px] border border-slate-200 bg-slate-50 px-[14px] py-3">
            <MaterialIcons
              name="lock"
              size={18}
              color="#64748b"
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-xs leading-[18px] text-slate-500">
              Dữ liệu thanh toán được mã hóa theo tiêu chuẩn PCI DSS. QR được
              làm mới tự động.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default PaymentScreen;