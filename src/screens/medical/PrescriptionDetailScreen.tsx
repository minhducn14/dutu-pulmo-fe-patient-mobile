import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { medicalService } from '@/services/medical.service';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoLine({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-start justify-between py-[11px] ${isLast ? '' : 'border-b border-slate-50'}`}
    >
      <Text className="flex-1 text-[13px] text-slate-400">{label}</Text>
      <Text
        className="flex-1 text-right text-sm font-semibold text-slate-900"
        numberOfLines={3}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function PrescriptionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId: string }>();

  const detailQuery = useQuery({
    queryKey: ['prescription', 'detail', prescriptionId],
    queryFn: () => medicalService.getPrescriptionDetail(prescriptionId),
    enabled: Boolean(prescriptionId),
  });

  const pdfQuery = useQuery({
    queryKey: ['prescription', 'pdf', prescriptionId],
    queryFn: () => medicalService.getPrescriptionPdf(prescriptionId),
    enabled: Boolean(prescriptionId),
  });

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await Promise.all([detailQuery.refetch(), pdfQuery.refetch()]);
  });

  if (detailQuery.isLoading) return <Loading label="Đang tải đơn thuốc..." />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không tìm thấy đơn thuốc"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const prescription = detailQuery.data;

  const pdfUrl = pdfQuery.data?.pdfUrl ?? pdfQuery.data?.url ?? null;

  const handleOpenPdf = async () => {
    if (!pdfUrl) return;
    await Linking.openURL(pdfUrl);
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View 
        className="flex-row items-center justify-between bg-blue-500 px-4 pb-4 shadow-sm"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Chi tiết đơn thuốc</Text>
        <View className="w-8" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── THÔNG TIN ĐƠN THUỐC ── */}
        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View className="px-4">
            <InfoLine
              label="Mã đơn thuốc"
              value={prescription.prescriptionNumber ?? '—'}
            />
            <InfoLine
              label="Bác sĩ kê đơn"
              value={prescription.doctor?.fullName ?? '—'}
            />
            <InfoLine
              label="Ngày kê đơn"
              value={
                prescription.createdAt
                  ? new Date(prescription.createdAt).toLocaleDateString(
                      'vi-VN',
                      { day: '2-digit', month: '2-digit', year: 'numeric' },
                    )
                  : '—'
              }
              isLast
            />
          </View>
        </View>

        {/* ── DANH SÁCH THUỐC ── */}
        <View className="mt-4">
          <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
            Danh sách thuốc ({prescription.items?.length ?? 0})
          </Text>
          <View className="gap-3">
            {(prescription.items ?? []).map((item: any, idx: number) => (
              <View
                key={item.id ?? idx}
                className="overflow-hidden rounded-2xl bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 3,
                }}
              >
                {/* Medicine name header */}
                <View className="border-b border-blue-100 bg-blue-50 px-4 py-3">
                  <Text className="text-sm font-bold text-blue-800">
                    {idx + 1}. {item.medicineName ?? 'Thuốc'}
                  </Text>
                </View>

                <View className="px-4">
                  <InfoLine label="Liều dùng" value={item.dosage ?? '—'} />
                  <InfoLine label="Tần suất" value={item.frequency ?? '—'} />
                  <InfoLine
                    label="Thời gian"
                    value={
                      item.duration ??
                      (item.durationDays ? `${item.durationDays} ngày` : '—')
                    }
                  />
                  <InfoLine
                    label="Số lượng"
                    value={
                      item.quantity != null
                        ? `${item.quantity} ${item.unit ?? ''}`.trim()
                        : '—'
                    }
                  />
                  {item.instructions && (
                    <InfoLine
                      label="Hướng dẫn"
                      value={item.instructions}
                      isLast
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── GHI CHÚ ── */}
        {prescription.notes && (
          <View className="mt-4">
            <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
              Ghi chú
            </Text>
            <View
              className="rounded-2xl bg-white px-4"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <View className="py-3">
                <Text className="text-sm leading-5 text-slate-700">
                  {prescription.notes}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── PDF ── */}
        <View className="mt-6">
          <TouchableOpacity
            onPress={handleOpenPdf}
            disabled={!pdfUrl}
            activeOpacity={0.85}
            className={`flex-row items-center justify-center gap-2 rounded-[14px] border border-blue-200 bg-blue-50 py-[14px] ${!pdfUrl ? 'opacity-50' : ''}`}
          >
            <MaterialIcons name="picture-as-pdf" size={18} color="#0A7CFF" />
            <Text className="text-sm font-semibold text-blue-500">
              {pdfUrl ? 'Tải đơn thuốc PDF' : 'PDF chưa được tạo'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default PrescriptionDetailScreen;
