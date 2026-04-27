import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FALLBACK_PRESCRIPTION_STATUS, PRESCRIPTION_STATUS_CONFIG } from '@/constants/status-configs';
import { patientService } from '@/services/patient.service';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

function PrescriptionCard({
  prescription,
  onPress,
}: {
  prescription: any;
  onPress: () => void;
}) {
  const statusConfig = PRESCRIPTION_STATUS_CONFIG[prescription.status] ?? FALLBACK_PRESCRIPTION_STATUS;
  const createdDate = new Date(prescription.createdAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="overflow-hidden rounded-2xl bg-white"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Card header: status + date */}
      <View className="flex-row items-center justify-between border-b border-slate-50 px-4 pb-3 pt-4">
        <View
          className={`flex-row items-center gap-1.5 ${statusConfig.bgClass} border ${statusConfig.borderClass} rounded-lg px-3 py-1.5`}
        >
          <MaterialIcons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
          <Text className={`text-xs font-semibold ${statusConfig.textClass}`}>
            {statusConfig.label}
          </Text>
        </View>

        <View className="rounded-lg bg-slate-50 px-3 py-1.5">
          <Text className="text-xs font-semibold text-slate-500">
            {`${weekdays[createdDate.getDay()]}, ${createdDate.toLocaleDateString('vi-VN')}`}
          </Text>
        </View>
      </View>

      {/* Doctor info */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <MaterialIcons name="medication" size={20} color="#60a5fa" />
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-slate-900" numberOfLines={1}>
            {prescription.prescriptionNumber}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            {prescription.items?.length ?? 0} loại thuốc
            {prescription.doctor?.fullName ? `  •  BS. ${prescription.doctor.fullName}` : ''}
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
      </View>

      {/* Footer: diagnosis */}
      {prescription.diagnosis && (
        <View className="px-4 pb-3">
          <Text className="text-[11px] text-slate-400" numberOfLines={1}>
            {prescription.diagnosis}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function PrescriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const meQuery = useQuery({
    queryKey: ['profile', 'my-patient'],
    queryFn: () => patientService.getMyPatient(),
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['prescriptions', meQuery.data?.id],
    queryFn: () => patientService.getPatientPrescriptions(meQuery.data!.id),
    enabled: Boolean(meQuery.data?.id),
  });

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await Promise.all([meQuery.refetch(), prescriptionsQuery.refetch()]);
  });

  if (meQuery.isLoading || prescriptionsQuery.isLoading) {
    return <Loading label="Đang tải đơn thuốc..." />;
  }

  if (meQuery.isError || prescriptionsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState title="Không thể tải đơn thuốc" description="Vui lòng thử lại sau." />
      </View>
    );
  }

  const prescriptions = prescriptionsQuery.data ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Đơn thuốc" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary */}
        {prescriptions.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm text-slate-500">
              Tổng cộng{' '}
              <Text className="font-bold text-slate-900">{prescriptions.length}</Text>{' '}
              đơn thuốc
            </Text>
          </View>
        )}

        {/* List */}
        <View className="gap-3">
          {prescriptions.length === 0 ? (
            <View className="mt-16 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <MaterialIcons name="medication" size={36} color="#93c5fd" />
              </View>
              <Text className="text-base font-bold text-slate-700">Chưa có đơn thuốc</Text>
              <Text className="mt-1 text-center text-sm text-slate-400">
                Đơn thuốc sẽ xuất hiện sau khi bác sĩ kê đơn
              </Text>
            </View>
          ) : (
            prescriptions.map((prescription: any) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onPress={() => router.push(`/prescriptions/${prescription.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default PrescriptionsScreen;

