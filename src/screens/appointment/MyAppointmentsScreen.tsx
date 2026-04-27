import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PendingPaymentBanner } from '@/components/appointment/PendingPaymentBanner';
import { APPOINTMENT_STATUS_CONFIG, FALLBACK_APPOINTMENT_STATUS } from '@/constants/status-configs';
import { useAppointments } from '@/hooks/useAppointments';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

function AppointmentCard({
  appointment,
  onPress,
}: {
  appointment: any;
  onPress: () => void;
}) {
  const router = useRouter();
  const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status] ?? FALLBACK_APPOINTMENT_STATUS;
  const isCancelled = appointment.status === 'CANCELLED';
  const isPendingPayment = appointment.status === 'PENDING_PAYMENT';
  const scheduledDate = new Date(appointment.scheduledAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`overflow-hidden rounded-2xl bg-white ${isPendingPayment ? 'border border-amber-200' : ''}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Pending Payment Highlight */}
      {isPendingPayment && (
        <View className="bg-amber-100/50 py-1.5 px-4 flex-row items-center gap-1.5 border-b border-amber-100">
          <MaterialIcons name="info-outline" size={12} color="#d97706" />
          <Text className="text-[10px] font-bold text-amber-700">Lịch của bạn đang chờ thanh toán</Text>
        </View>
      )}

      {/* Card header: status + date */}
      <View className="flex-row items-center justify-between border-b border-slate-50 px-4 pb-3 pt-4">
        {/* Status badge */}
        <View
          className={`flex-row items-center gap-1.5 ${statusConfig.bgClass} border ${statusConfig.borderClass} rounded-lg px-3 py-1.5`}
        >
          <MaterialIcons
            name={statusConfig.icon as any}
            size={14}
            color={statusConfig.color}
          />
          <Text className={`text-xs font-semibold ${statusConfig.textClass}`}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Date chip */}
        <View className="rounded-lg bg-slate-50 px-3 py-1.5">
          <Text className="text-xs font-semibold text-slate-500">
            {`${weekdays[scheduledDate.getDay()]}, ${scheduledDate.toLocaleDateString('vi-VN')}`}
          </Text>
        </View>
      </View>

      {/* Doctor info */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="h-12 w-12 overflow-hidden rounded-full bg-blue-100">
          {appointment.doctor?.avatarUrl ? (
            <Image
              source={{ uri: appointment.doctor.avatarUrl }}
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
          <Text
            className="text-[15px] font-bold uppercase text-slate-900"
            numberOfLines={1}
          >
            {appointment.doctor?.fullName ?? 'Bác sĩ'}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            {appointment.doctor?.specialty ?? 'Chuyên khoa'}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
            {scheduledDate.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
      </View>

      {/* Appointment number footer */}
      <View className="flex-row items-center justify-between px-4 pb-3">
        <View>
          <Text className="text-[11px] text-slate-400">
            Mã phiếu:{' '}
            <Text className="font-semibold text-slate-500">
              {appointment.appointmentNumber ?? '—'}
            </Text>
          </Text>

          {isCancelled && (
            <Text className="text-[11px] font-medium text-red-400 mt-0.5">Đã hủy lịch</Text>
          )}
        </View>

        {isPendingPayment && (
          <TouchableOpacity
            onPress={() => router.push(`/appointments/payment?appointmentId=${appointment.id}`)}
            className="bg-amber-500 px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white text-[11px] font-bold">Thanh toán ngay</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function MyAppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const appointmentsQuery = useAppointments();

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await appointmentsQuery.refetch();
  });

  if (appointmentsQuery.isLoading) {
    return <Loading label="Đang tải lịch khám..." />;
  }

  if (appointmentsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải lịch khám"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const appointments = appointmentsQuery.data?.items ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Lịch khám của tôi" hideBack={true} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <PendingPaymentBanner />

        {/* Summary row */}
        {appointments.length > 0 && (
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">
              Tổng cộng{' '}
              <Text className="font-bold text-slate-900">
                {appointments.length}
              </Text>{' '}
              lịch khám
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/doctors')}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={16} color="#0A7CFF" />
              <Text className="text-sm font-medium text-blue-500">
                Đặt lịch mới
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <View className="gap-3">
          {appointments.length === 0 ? (
            <View className="mt-16 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <MaterialIcons
                  name="calendar-today"
                  size={36}
                  color="#93c5fd"
                />
              </View>
              <Text className="text-base font-bold text-slate-700">
                Chưa có lịch khám
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-400">
                Hãy đặt lịch với bác sĩ để bắt đầu
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/doctors')}
                activeOpacity={0.85}
                className="mt-6 flex-row items-center gap-2 rounded-2xl bg-blue-500 px-8 py-3"
                style={{
                  shadowColor: '#0A7CFF',
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <MaterialIcons name="search" size={18} color="white" />
                <Text className="text-sm font-bold text-white">Tìm bác sĩ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            appointments.map((appointment: any) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onPress={() => router.push(`/appointments/${appointment.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default MyAppointmentsScreen;

