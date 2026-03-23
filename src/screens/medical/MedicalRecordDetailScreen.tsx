import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Loading } from '@/components/ui/Loading';
import { medicalService } from '@/services/medical.service';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FALLBACK_MEDICAL_RECORD_STATUS, MEDICAL_RECORD_STATUS_CONFIG } from '@/constants/status-configs';

const SIGNED_CONFIG: Record<
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
  SIGNED: {
    label: 'Đã ký số',
    icon: 'verified',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
  NOT_SIGNED: {
    label: 'Chưa ký',
    icon: 'pending-actions',
    color: '#94a3b8',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-500',
  },
};

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

function HtmlRow({
  label,
  html,
  isLast,
}: {
  label: string;
  html: string;
  isLast?: boolean;
}) {
  const { width } = useWindowDimensions();

  if (!html) {
    return <InfoLine label={label} value="—" isLast={isLast} />;
  }

  return (
    <View className={`py-[11px] ${isLast ? '' : 'border-b border-slate-50'}`}>
      <Text className="mb-2 text-[13px] text-slate-400">{label}</Text>
      <RenderHtml
        contentWidth={width - 48} // Padding ngang (24 * 2)
        source={{ html }}
        baseStyle={{
          fontSize: 14,
          color: '#0f172a',
          lineHeight: 20,
        }}
        tagsStyles={{
          p: { margin: 0, padding: 0 },
          div: { margin: 0, padding: 0 },
        }}
      />
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4">
      <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-2xl bg-white"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <View className="px-4">{children}</View>
      </View>
    </View>
  );
}

function StatusBadge({
  config,
}: {
  config: {
    label: string;
    icon: string;
    color: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
  };
}) {
  return (
    <View
      className={`flex-row items-center gap-1.5 ${config.bgClass} border ${config.borderClass} rounded-lg px-3 py-1.5`}
    >
      <MaterialIcons name={config.icon as any} size={14} color={config.color} />
      <Text className={`text-xs font-semibold ${config.textClass}`}>
        {config.label}
      </Text>
    </View>
  );
}

export function MedicalRecordDetailScreen() {
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();

  const detailQuery = useQuery({
    queryKey: ['medical-record', 'detail', recordId],
    queryFn: () => medicalService.getMedicalRecordDetail(recordId),
    enabled: Boolean(recordId),
  });

  const pdfQuery = useQuery({
    queryKey: ['medical-record', 'pdf', recordId],
    queryFn: () => medicalService.getMedicalRecordPdf(recordId),
    enabled: Boolean(recordId),
  });

  if (detailQuery.isLoading) return <Loading label="Đang tải hồ sơ..." />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <EmptyState
          title="Không tìm thấy hồ sơ"
          description="Vui lòng thử lại sau."
        />
      </View>
    );
  }

  const record = detailQuery.data;
  const pdfUrl = pdfQuery.data?.pdfUrl ?? pdfQuery.data?.url ?? null;
  const statusConfig =
    MEDICAL_RECORD_STATUS_CONFIG[record.status] ?? FALLBACK_MEDICAL_RECORD_STATUS;
  const signedConfig =
    SIGNED_CONFIG[record.signedStatus] ?? SIGNED_CONFIG['NOT_SIGNED'];
  const vs = record.vitalSigns ?? {};

  const handleOpenPdf = async () => {
    if (!pdfUrl) return;
    await Linking.openURL(pdfUrl);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader title="Chi tiết hồ sơ y tế" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-[120px]"
        showsVerticalScrollIndicator={false}
      >
        {/* ── THÔNG TIN HÀNH CHÍNH ── */}
        <View
          className="overflow-hidden rounded-2xl bg-white"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View className="px-4 pb-3 pt-4">
            {/* Status badges row */}
            <View className="mb-3 flex-row flex-wrap gap-2">
              <StatusBadge config={statusConfig} />
              <StatusBadge config={signedConfig} />
            </View>
            <InfoLine label="Mã hồ sơ" value={record.recordNumber ?? '—'} />
            <InfoLine
              label="Bệnh nhân"
              value={record.patient?.fullName ?? '—'}
            />
            <InfoLine label="Bác sĩ" value={record.doctor?.fullName ?? '—'} />
            <InfoLine
              label="Ngày khám"
              value={
                record.appointment?.scheduledAt
                  ? new Date(record.appointment.scheduledAt).toLocaleDateString(
                      'vi-VN',
                      {
                        weekday: 'long',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      },
                    )
                  : '—'
              }
              isLast
            />
          </View>
        </View>

        {/* ── HỒ SƠ LIÊN QUAN (TIỀN SỬ) ── */}
        {(record as any).previousRecord && (
          <SectionCard title="Hồ sơ liên quan (Tiền sử gần nhất)">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/medical/[recordId]',
                  params: { recordId: (record as any).previousRecord.id },
                })
              }
              activeOpacity={0.7}
              className="bg-blue-50/50 rounded-xl border border-blue-100 p-3 mb-3 mt-1"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="bg-blue-100 px-2 py-0.5 rounded">
                  <Text className="text-[10px] font-bold text-blue-700">
                    #{(record as any).previousRecord.recordNumber}
                  </Text>
                </View>
                <Text className="text-[10px] text-slate-500 italic">
                  {(record as any).previousRecord.recordType}
                </Text>
              </View>
              
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="event" size={14} color="#94a3b8" />
                <Text className="text-xs text-slate-600 ml-1.5">
                  Ngày khám: <Text className="font-semibold text-slate-900">
                    {new Date((record as any).previousRecord.createdAt).toLocaleDateString('vi-VN')}
                  </Text>
                </Text>
              </View>

              <View className="flex-row items-center">
                <MaterialIcons name="person" size={14} color="#94a3b8" />
                <Text className="text-xs text-slate-600 ml-1.5">
                  Bác sĩ: <Text className="font-semibold text-slate-900">
                    {(record as any).previousRecord.doctorName || '—'}
                  </Text>
                </Text>
              </View>

              <View className="mt-2 pt-2 border-t border-blue-100 flex-row justify-end items-center">
                <Text className="text-[11px] font-bold text-blue-600 mr-1">
                  Xem chi tiết
                </Text>
                <MaterialIcons name="arrow-forward" size={12} color="#2563eb" />
              </View>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* ── CHỈ SỐ SINH HIỆU ── */}
        <SectionCard title="Chỉ số sinh hiệu">
          <InfoLine
            label="Nhiệt độ (°C)"
            value={vs.temperature != null ? String(vs.temperature) : '—'}
          />
          <InfoLine label="Huyết áp" value={vs.bloodPressure ?? '—'} />
          <InfoLine
            label="Nhịp tim (bpm)"
            value={vs.heartRate != null ? String(vs.heartRate) : '—'}
          />
          <InfoLine
            label="Nhịp thở (bpm)"
            value={
              vs.respiratoryRate != null ? String(vs.respiratoryRate) : '—'
            }
          />
          <InfoLine
            label="SpO2 (%)"
            value={vs.spo2 != null ? String(vs.spo2) : '—'}
          />
          <InfoLine
            label="Chiều cao (cm)"
            value={vs.height != null ? String(vs.height) : '—'}
          />
          <InfoLine
            label="Cân nặng (kg)"
            value={vs.weight != null ? String(vs.weight) : '—'}
          />
          <InfoLine
            label="BMI"
            value={vs.bmi != null ? String(vs.bmi) : '—'}
            isLast
          />
        </SectionCard>

        {/* ── BỆNH ÁN ── */}
        <SectionCard title="Bệnh án">
          <InfoLine label="Lý do khám" value={record.chiefComplaint ?? '—'} />
          <HtmlRow
            label="Quá trình bệnh lý"
            html={record.presentIllness || ''}
          />
          <InfoLine
            label="Đánh giá lâm sàng"
            value={record.assessment ?? '—'}
          />
          <InfoLine label="Chẩn đoán" value={record.diagnosis ?? '—'} />
          <InfoLine
            label="Phác đồ điều trị"
            value={record.treatmentPlan ?? '—'}
          />
          <InfoLine
            label="Ghi chú theo dõi"
            value={record.progressNotes ?? '—'}
          />
          <InfoLine
            label="Hướng điều trị tiếp"
            value={record.followUpInstructions ?? '—'}
            isLast
          />
        </SectionCard>

        {/* ── BỆNH SỬ ── */}
        <SectionCard title="Bệnh sử">
          <InfoLine label="Tiền sử bệnh" value={record.medicalHistory ?? '—'} />
          <InfoLine
            label="Tiền sử phẫu thuật"
            value={record.surgicalHistory ?? '—'}
          />
          <InfoLine
            label="Tiền sử gia đình"
            value={record.familyHistory ?? '—'}
          />
          <InfoLine
            label="Dị ứng"
            value={record.allergies?.length ? record.allergies.join(', ') : '—'}
          />
          <InfoLine
            label="Bệnh mãn tính"
            value={
              record.chronicDiseases?.length
                ? record.chronicDiseases.join(', ')
                : '—'
            }
          />
          <InfoLine
            label="Thuốc đang dùng"
            value={
              record.currentMedications?.length
                ? record.currentMedications.join(', ')
                : '—'
            }
            isLast
          />
        </SectionCard>

        {/* ── LỐI SỐNG ── */}
        <SectionCard title="Lối sống">
          <InfoLine
            label="Hút thuốc"
            value={
              record.smokingStatus
                ? `Có${record.smokingYears ? ` (${record.smokingYears} năm)` : ''}`
                : 'Không'
            }
          />
          <InfoLine
            label="Rượu bia"
            value={record.alcoholConsumption ? 'Có' : 'Không'}
            isLast
          />
        </SectionCard>

        {/* ── TỔNG KẾT ── */}
        {(record.primaryDiagnosis ||
          record.secondaryDiagnosis ||
          record.dischargeCondition ||
          record.fullRecordSummary) && (
          <SectionCard title="Tổng kết ra viện">
            <InfoLine
              label="Chẩn đoán chính"
              value={record.primaryDiagnosis ?? '—'}
            />
            <InfoLine
              label="Chẩn đoán kèm"
              value={record.secondaryDiagnosis ?? '—'}
            />
            <InfoLine
              label="Tình trạng ra viện"
              value={record.dischargeCondition ?? '—'}
            />
            <InfoLine
              label="Tóm tắt hồ sơ"
              value={record.fullRecordSummary ?? '—'}
              isLast
            />
          </SectionCard>
        )}

        {/* ── TẦM SOÁT ── */}
        {record.screeningRequests && record.screeningRequests.length > 0 && (
          <SectionCard title="Tầm soát">
            {record.screeningRequests.map((sr: any, idx: number) => (
              <View
                key={sr.id}
                className={`py-3 ${idx < record.screeningRequests.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-slate-900">
                    {sr.screeningNumber ?? '—'}
                  </Text>
                  <Text className="text-xs capitalize text-slate-500">
                    {sr.screeningType ?? ''}
                  </Text>
                </View>
                {sr.aiAnalyses?.[0]?.primaryDiagnosis?.name_vn && (
                  <Text className="mt-1 text-xs text-slate-600">
                    AI: {sr.aiAnalyses[0].primaryDiagnosis.name_vn}
                  </Text>
                )}
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── ĐƠN THUỐC ── */}
        {record.prescriptions && record.prescriptions.length > 0 && (
          <View className="mt-4">
            <Text className="mb-[10px] text-[15px] font-bold text-slate-900">
              Đơn thuốc
            </Text>
            <View className="gap-3">
              {record.prescriptions.map((prescription: any) => (
                <TouchableOpacity
                  key={prescription.id}
                  onPress={() =>
                    router.push(`/prescriptions/${prescription.id}`)
                  }
                  activeOpacity={0.85}
                  className="flex-row items-center justify-between rounded-[14px] border border-slate-100 bg-white px-4 py-3"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-900">
                      {prescription.prescriptionNumber}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {prescription.items?.length ?? 0} loại thuốc
                      {prescription.pdfUrl ? '  •  PDF sẵn sàng' : ''}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#cbd5e1"
                  />
                </TouchableOpacity>
              ))}
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
              {pdfUrl ? 'Tải bệnh án PDF' : 'PDF chưa được tạo'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

export default MedicalRecordDetailScreen;

