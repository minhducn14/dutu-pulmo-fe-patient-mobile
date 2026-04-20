import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View, RefreshControl } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { REPORT_STATUS_CONFIG } from '@/constants/status-configs';
import { useReports } from '@/hooks/useReports';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

const REPORT_TYPE_LABEL: Record<string, string> = {
  doctor: 'Báo cáo bác sĩ',
  appointment: 'Báo cáo lịch khám',
  system: 'Báo cáo hệ thống',
};

function ReportCard({ report }: { report: any }) {
  const statusConfig =
    REPORT_STATUS_CONFIG[report.status] ?? REPORT_STATUS_CONFIG['pending'];
  const createdAt = new Date(report.createdAt);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <View
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
            {`${weekdays[createdAt.getDay()]}, ${createdAt.toLocaleDateString('vi-VN')}`}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="px-4 py-3">
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-red-50">
            <MaterialIcons name="flag" size={16} color="#dc2626" />
          </View>
          <Text className="text-[13px] font-semibold text-slate-500">
            {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
          </Text>
        </View>

        <Text className="text-[14px] leading-[20px] text-slate-900" numberOfLines={3}>
          {report.content}
        </Text>
      </View>

      {report.adminNotes && (
        <View className="mx-4 mb-4 rounded-xl bg-blue-50 px-3 py-2.5">
          <Text className="mb-1 text-[11px] font-bold tracking-[0.6px] text-blue-500">
            PHẢN HỒI TỪ ADMIN
          </Text>
          <Text className="text-[13px] leading-[18px] text-slate-700">
            {report.adminNotes}
          </Text>
        </View>
      )}
    </View>
  );
}

export function MyReportsScreen() {
  const router = useRouter();
  const reportsQuery = useReports();

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await reportsQuery.refetch();
  });

  if (reportsQuery.isLoading) return <Loading label="Đang tải báo cáo..." />;

  if (reportsQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không thể tải báo cáo"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const reports = reportsQuery.data ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Báo cáo của tôi"
        rightSlot={
          <TouchableOpacity
            onPress={() => router.push('/reports/new')}
            activeOpacity={0.7}
            className="rounded-full p-1"
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reports.length === 0 ? (
          <View className="mt-16 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <MaterialIcons name="flag" size={36} color="#93c5fd" />
            </View>
            <Text className="text-base font-bold text-slate-700">
              Chưa có báo cáo nào
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-400">
              Báo cáo sự cố về bác sĩ hoặc lịch khám tại đây
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/reports/new')}
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
              <MaterialIcons name="add" size={18} color="white" />
              <Text className="text-sm font-bold text-white">Gửi báo cáo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Summary */}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">
                Tổng cộng{' '}
                <Text className="font-bold text-slate-900">{reports.length}</Text>{' '}
                báo cáo
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/reports/new')}
                activeOpacity={0.7}
                className="flex-row items-center gap-1"
              >
                <MaterialIcons name="add" size={16} color="#0A7CFF" />
                <Text className="text-sm font-medium text-blue-500">
                  Gửi mới
                </Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View className="gap-3">
              {reports.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default MyReportsScreen;
