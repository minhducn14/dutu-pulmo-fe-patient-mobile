import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  FALLBACK_MEDICAL_RECORD_STATUS,
  MEDICAL_RECORD_STATUS_CONFIG,
} from '@/constants/status-configs';
import { patientService } from '@/services/patient.service';
import { useQuery } from '@tanstack/react-query';

function MedicalRecordCard({
  record,
  onPress,
}: {
  record: any;
  onPress: () => void;
}) {
  const statusConfig =
    MEDICAL_RECORD_STATUS_CONFIG[record.status] ??
    FALLBACK_MEDICAL_RECORD_STATUS;
  const scheduledAt = record.appointment?.scheduledAt
    ? new Date(record.appointment.scheduledAt)
    : new Date(record.createdAt);
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
      {/* Card header: status badge + date chip */}
      <View className="flex-row items-center justify-between border-b border-slate-50 px-4 pb-3 pt-4">
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

        <View className="rounded-lg bg-slate-50 px-3 py-1.5">
          <Text className="text-xs font-semibold text-slate-500">
            {`${weekdays[scheduledAt.getDay()]}, ${scheduledAt.toLocaleDateString('vi-VN')}`}
          </Text>
        </View>
      </View>

      {/* Doctor info */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <MaterialIcons name="person" size={20} color="#60a5fa" />
        </View>

        <View className="flex-1">
          <Text
            className="text-[15px] font-bold uppercase text-slate-900"
            numberOfLines={1}
          >
            {record.doctor?.fullName ?? 'Bác sĩ'}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
            {record.appointment?.scheduledAt
              ? new Date(record.appointment.scheduledAt).toLocaleTimeString(
                  'vi-VN',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )
              : '—'}
          </Text>
        </View>

        <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
      </View>

      {/* Footer: record number */}
      <View className="flex-row items-center px-4 pb-3">
        <Text className="text-[11px] text-slate-400">
          Mã hồ sơ:{' '}
          <Text className="font-semibold text-slate-500">
            {record.recordNumber ?? '—'}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function MedicalRecordsScreen() {
  const router = useRouter();

  const meQuery = useQuery({
    queryKey: ['profile', 'my-patient'],
    queryFn: () => patientService.getMyPatient(),
  });

  const recordsQuery = useQuery({
    queryKey: ['medical-records', meQuery.data?.id],
    queryFn: () => patientService.getPatientMedicalRecords(meQuery.data!.id),
    enabled: Boolean(meQuery.data?.id),
  });

  if (meQuery.isLoading || recordsQuery.isLoading) {
    return <Loading label="Đang tải Hồ sơ bệnh án..." />;
  }

  if (meQuery.isError || recordsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải hồ sơ"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const records = recordsQuery.data ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Hồ sơ bệnh án" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Summary row */}
        {records.length > 0 && (
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm text-slate-500">
              Tổng cộng{' '}
              <Text className="font-bold text-slate-900">{records.length}</Text>{' '}
              hồ sơ
            </Text>
          </View>
        )}

        {/* List */}
        <View className="gap-3">
          {records.length === 0 ? (
            <View className="mt-16 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <MaterialIcons name="folder-open" size={36} color="#93c5fd" />
              </View>
              <Text className="text-base font-bold text-slate-700">
                Chưa có Hồ sơ bệnh án
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-400">
                Hồ sơ sẽ xuất hiện sau khi hoàn thành buổi khám
              </Text>
            </View>
          ) : (
            records.map((record: any) => (
              <MedicalRecordCard
                key={record.id}
                record={record}
                onPress={() => router.push(`/medical-records/${record.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default MedicalRecordsScreen;
