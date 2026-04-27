import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { useCreateReport } from '@/hooks/useReports';
import { usePublicDoctors, useAppointments } from '@/hooks/useAppointments';
import { Modal } from '@/components/ui/Modal';
import { theme } from '@/constants/theme';

const REPORT_TYPES = [
  {
    value: 'doctor',
    label: 'Báo cáo bác sĩ',
    icon: 'person-off',
    color: '#dc2626',
    bgColor: '#FEF2F2',
  },
  {
    value: 'appointment',
    label: 'Báo cáo lịch khám',
    icon: 'event-busy',
    color: '#d97706',
    bgColor: '#FFFBEB',
  },
  {
    value: 'system',
    label: 'Báo cáo hệ thống',
    icon: 'bug-report',
    color: '#7c3aed',
    bgColor: '#F5F3FF',
  },
] as const;

type ReportTypeValue = 'doctor' | 'appointment' | 'system';

const schema = z.object({
  reportType: z.enum(['doctor', 'appointment', 'system']),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),
});

type FormData = z.infer<typeof schema>;

// ─── LOCAL COMPONENTS ────────────────────────────────────────────────────────
function SelectionCard({
  label,
  value,
  placeholder,
  onPress,
  icon,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  icon: string;
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[15px] font-bold text-slate-900">{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5"
      >
        <View className="flex-row items-center gap-2.5">
          <MaterialIcons name={icon as any} size={18} color={value ? '#0A7CFF' : '#94a3b8'} />
          <Text
            className={`text-sm ${value ? 'font-semibold text-slate-900' : 'text-slate-400'}`}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>
        <MaterialIcons name="unfold-more" size={18} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createMutation = useCreateReport();

  // Pickers State
  const [showDocModal, setShowDocModal] = useState(false);
  const [showAptModal, setShowAptModal] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docSearchDebounced, setDocSearchDebounced] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedDocLabel, setSelectedDocLabel] = useState('');
  const [selectedAptLabel, setSelectedAptLabel] = useState('');

  // Hooks
  const doctorsQuery = usePublicDoctors({
    page: 1, limit: 10, search: docSearchDebounced || undefined
  });
  const appointmentsQuery = useAppointments({ limit: 50 });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reportType: 'system',
      doctorId: '',
      appointmentId: '',
      content: '',
    },
  });

  const selectedType = watch('reportType');

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDocSearchDebounced(docSearch), 500);
  }, [docSearch]);

  const onSubmit = (values: FormData) => {
    createMutation.mutate(
      {
        reportType: values.reportType,
        doctorId: values.doctorId?.trim() || undefined,
        appointmentId: values.appointmentId?.trim() || undefined,
        content: values.content,
      },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Báo cáo của bạn đã được gửi. Chúng tôi sẽ xem xét sớm nhất.', [
            { text: 'OK', onPress: () => router.replace('/reports') },
          ]);
        },
        onError: (error: any) => {
          const errMsg = error?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
          Alert.alert('Lỗi', typeof errMsg === 'string' ? errMsg : 'Có lỗi xảy ra');
        },
      },
    );
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
        <Text className="text-lg font-bold text-white">Gửi báo cáo</Text>
        <View className="w-8" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 24) + 100,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* ── INFO BOX ── */}
        <View className="mb-5 flex-row items-start gap-3 rounded-[14px] border border-blue-200 bg-blue-50 px-4 py-3">
          <MaterialIcons name="info" size={18} color="#0A7CFF" style={{ marginTop: 1 }} />
          <Text className="flex-1 text-[13px] leading-[18px] text-slate-600">
            Báo cáo của bạn sẽ được xem xét trong vòng 1-3 ngày làm việc. Vui lòng cung cấp thông tin chi tiết để chúng tôi hỗ trợ tốt nhất.
          </Text>
        </View>

        {/* ── LOẠI BÁO CÁO ── */}
        <View className="mb-5">
          <Text className="mb-3 text-[15px] font-bold text-slate-900">
            Loại báo cáo
          </Text>
          <View className="gap-2.5">
            {REPORT_TYPES.map((type) => {
              const isSelected = selectedType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => {
                    setValue('reportType', type.value as ReportTypeValue);
                    setValue('doctorId', '');
                    setValue('appointmentId', '');
                    setSelectedDocLabel('');
                    setSelectedAptLabel('');
                  }}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-[14px] ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-100 bg-white'
                  }`}
                  style={
                    isSelected
                      ? {
                          shadowColor: '#0A7CFF',
                          shadowOpacity: 0.12,
                          shadowRadius: 8,
                          elevation: 2,
                        }
                      : {
                          shadowColor: '#000',
                          shadowOpacity: 0.04,
                          shadowRadius: 4,
                          elevation: 1,
                        }
                  }
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: type.bgColor }}
                  >
                    <MaterialIcons
                      name={type.icon as any}
                      size={20}
                      color={type.color}
                    />
                  </View>
                  <Text
                    className={`flex-1 text-[14px] font-semibold ${
                      isSelected ? 'text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {type.label}
                  </Text>
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={12} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SELECT BÁC SĨ */}
        {selectedType === 'doctor' && (
          <SelectionCard
            label="Chọn bác sĩ"
            value={selectedDocLabel}
            placeholder="Tìm kiếm bác sĩ..."
            icon="person"
            onPress={() => setShowDocModal(true)}
          />
        )}

        {/* SELECT LỊCH KHÁM */}
        {selectedType === 'appointment' && (
          <SelectionCard
            label="Chọn lịch khám"
            value={selectedAptLabel}
            placeholder="Chọn 1 lịch khám gần đây..."
            icon="event"
            onPress={() => setShowAptModal(true)}
          />
        )}

        {/* ── NỘI DUNG BÁO CÁO ── */}
        <View className="mb-5">
          <Text className="mb-2 text-[15px] font-bold text-slate-900">
            Nội dung báo cáo
          </Text>
          <Controller
            control={control}
            name="content"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                className="min-h-[140px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900"
                style={{ textAlignVertical: 'top' }}
              />
            )}
          />
          {errors.content && (
            <Text className="mt-1.5 text-[12px] text-red-500">
              {errors.content.message}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* FIXED BOTTOM */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 16,
        }}
      >
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
          activeOpacity={0.85}
          className={`flex-row items-center justify-center gap-2 rounded-[14px] py-4 ${
            createMutation.isPending ? 'bg-blue-300' : 'bg-blue-500'
          }`}
          style={{
            shadowColor: '#0A7CFF',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="send" size={18} color="white" />
          <Text className="text-[15px] font-bold text-white">
            {createMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DOCTOR MODAL */}
      <Modal visible={showDocModal} onRequestClose={() => setShowDocModal(false)}>
        <View className="h-[80%] w-full rounded-3xl bg-white p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">Chọn bác sĩ</Text>
            <TouchableOpacity onPress={() => setShowDocModal(false)}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View className="mb-4 flex-row items-center rounded-xl bg-slate-100 px-3 py-2">
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Tìm tên bác sĩ..."
              value={docSearch}
              onChangeText={setDocSearch}
              className="ml-2 flex-1 py-1 text-sm text-slate-900"
            />
          </View>

          {doctorsQuery.isLoading ? <ActivityIndicator color="#0A7CFF" className="mt-10" /> : (
            <FlatList
              data={doctorsQuery.data?.items || []}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setValue('doctorId', item.id);
                    setSelectedDocLabel(`${item.title || 'BS.'} ${item.fullName}`);
                    setShowDocModal(false);
                  }}
                  className="mb-2 flex-row items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-3"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <MaterialIcons name="person" size={24} color="#0A7CFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{item.title || 'BS.'} {item.fullName}</Text>
                    <Text className="text-xs text-slate-500">{item.specialty || 'Chuyên khoa'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* APPOINTMENT MODAL */}
      <Modal visible={showAptModal} onRequestClose={() => setShowAptModal(false)}>
        <View className="max-h-[70%] w-full rounded-3xl bg-white p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">Chọn lịch khám</Text>
            <TouchableOpacity onPress={() => setShowAptModal(false)}>
              <MaterialIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {appointmentsQuery.isLoading ? <ActivityIndicator color="#0A7CFF" className="mt-10" /> : (
            <FlatList
              data={appointmentsQuery.data?.items || []}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text className="py-10 text-center text-slate-400">Không có lịch khám gần đây</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setValue('appointmentId', item.id);
                    setSelectedAptLabel(`#${item.appointmentNumber} - ${new Date(item.scheduledAt).toLocaleDateString('vi-VN')}`);
                    setShowAptModal(false);
                  }}
                  className="mb-2 rounded-2xl border border-slate-50 bg-slate-50/50 p-4"
                >
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-slate-900">#{item.appointmentNumber}</Text>
                    <Text className="text-xs text-slate-400">{new Date(item.scheduledAt || '').toLocaleDateString('vi-VN')}</Text>
                  </View>
                  <Text className="text-xs text-slate-600">Bác sĩ: {item.doctor?.fullName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

export default ReportIssueScreen;