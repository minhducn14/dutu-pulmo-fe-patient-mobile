import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  RichEditor,
  RichToolbar,
  actions,
} from 'react-native-pell-rich-editor';
import { z } from 'zod';

import { Loading } from '@/components/ui/Loading';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePicker } from '@/components/doctor/DatePicker';
import { TimeSlotGrid } from '@/components/doctor/TimeSlotGrid';
import { SectionLabel } from '@/components/doctor/SectionLabel';
import { StepBar } from '@/components/appointment/StepBar';
import { InfoRowHorizontal } from '@/components/appointment/InfoRowHorizontal';
import {
  buildDateWindow,
  formatDate,
  genderLabel,
  toLocalDateString,
  toTimeSlots,
} from '@/utils/appointment-helpers';
import {
  useDoctorAvailableSlots,
  useDoctorTimeSlotSummary,
  usePublicDoctorDetail,
} from '@/hooks/useAppointments';
import { useMyPatient } from '@/hooks/useProfile';
import { useBookingStore } from '@/store/booking.store';
import { useAuthStore } from '@/store/auth.store';
import { getDoctorTitleLabel, getSpecialtyLabel } from '@/utils/doctor-display';

const schema = z.object({
  chiefComplaint: z.string().optional(),
  symptoms: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const BASE_DATES = buildDateWindow();

// ─── Local sub-components ─────────────────────────────────────────────────────
function Divider() {
  return <View className="h-px bg-gray-100" />;
}

function TimelineDot({
  icon,
  color = '#0A7CFF',
}: {
  icon: string;
  color?: string;
}) {
  return (
    <View className="absolute -left-[33px] top-0 bg-blue-50 p-1">
      <MaterialIcons name={icon as any} size={20} color={color} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export function BookAppointmentScreen() {
  const router = useRouter();
  const {
    doctorId,
    date: paramDate,
    slotId: preSelectedSlotId,
  } = useLocalSearchParams<{
    doctorId: string;
    date?: string;
    slotId?: string;
  }>();

  const user = useAuthStore((s) => s.user);
  const setDraft = useBookingStore((s) => s.setDraft);
  const myPatientQuery = useMyPatient();
  const doctorQuery = usePublicDoctorDetail(doctorId ?? '');

  // ── Date state ────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(
    paramDate ?? BASE_DATES[0]?.date ?? toLocalDateString(new Date()),
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    preSelectedSlotId ?? null,
  );

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDate]);

  const slotsQuery = useDoctorAvailableSlots(doctorId, selectedDate);
  const summaryQuery = useDoctorTimeSlotSummary(
    doctorId ?? '',
    BASE_DATES[0]?.date ?? selectedDate,
    BASE_DATES[BASE_DATES.length - 1]?.date ?? selectedDate,
  );

  const summaryMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of summaryQuery.data ?? []) {
      m.set(item.date, item.count);
    }
    return m;
  }, [summaryQuery.data]);

  const weekDates = useMemo(
    () => BASE_DATES.map((d) => ({ ...d, slots: summaryMap.get(d.date) ?? 0 })),
    [summaryMap],
  );

  const timeSlots = useMemo(
    () => toTimeSlots(slotsQuery.data ?? []),
    [slotsQuery.data],
  );
  const morning = useMemo(
    () => timeSlots.filter((s) => s.period === 'morning'),
    [timeSlots],
  );
  const afternoon = useMemo(
    () => timeSlots.filter((s) => s.period === 'afternoon'),
    [timeSlots],
  );
  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.id === selectedSlotId) ?? null,
    [timeSlots, selectedSlotId],
  );
  const selectedLabel = selectedSlot?.label ?? null;

  // ── Additional info form ──────────────────────────────────────────────────
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [patientInfoExpanded, setPatientInfoExpanded] = useState(false);
  const [patientNotesHtml, setPatientNotesHtml] = useState('');
  const richEditorRef = useRef<RichEditor>(null);
  const base64ImageCount = (patientNotesHtml.match(/data:image\//gi) ?? [])
    .length;
  const [editorHeight, setEditorHeight] = useState(140);

  const handleInsertImage = useCallback(async () => {
    if (base64ImageCount >= 5) {
      alert('Tối đa 5 ảnh');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const dataUri = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    richEditorRef.current?.insertImage(
      dataUri,
      'max-width:100%;border-radius:8px;',
    );
  }, [base64ImageCount]);

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { chiefComplaint: '', symptoms: '' },
  });

  // ── Computed display values ───────────────────────────────────────────────
  const myPatient = myPatientQuery.data;
  const doctor = doctorQuery.data;
  const titleLabel = doctor ? getDoctorTitleLabel(doctor.title) : '';
  const specialtyLabel = doctor
    ? getSpecialtyLabel(doctor.specialty ?? '')
    : '';
  const fallback = '—';
  const patientUser = myPatient?.user;
  const profileCode =
    myPatient?.profileCode ?? fallback;
  const displayName = patientUser?.fullName ?? user?.fullName ?? fallback;
  const displayGender = genderLabel(patientUser?.gender);
  const displayDOB = formatDate(patientUser?.dateOfBirth);
  const displayPhone = patientUser?.phone ?? fallback;
  const avatarUrl = patientUser?.avatarUrl ?? user?.avatarUrl;
  const displayEmail = patientUser?.email ?? fallback;
  const displayCCCD = patientUser?.CCCD ?? fallback;
  const displayNationality = patientUser?.nationality ?? fallback;
  const displayEthnicity = patientUser?.ethnicity ?? fallback;
  const displayOccupation = patientUser?.occupation ?? fallback;
  const displayAddress = patientUser?.address ?? fallback;
  const displayWard = patientUser?.ward ?? fallback;
  const displayProvince = patientUser?.province ?? fallback;

  const onSubmit = (values: FormData) => {
    if (!selectedSlotId || !selectedSlot) return;
    const localHour = new Date(selectedSlot.startTime).getHours();
    const period = localHour < 12 ? 'morning' : 'afternoon';
    const rawFee =
      slotsQuery.data?.find((s) => s.id === selectedSlotId)
        ?.finalConsultationFee ?? '0';
    setDraft({
      doctorId: doctorId ?? '',
      date: selectedDate,
      slotId: selectedSlotId,
      slotLabel: selectedSlot.label,
      period,
      chiefComplaint: values.chiefComplaint?.trim() || undefined,
      symptoms: values.symptoms?.trim() || undefined,
      patientNotes: patientNotesHtml || undefined,
      finalConsultationFee: parseInt(rawFee),
    });
    router.push('/appointments/confirm');
  };

  if (doctorQuery.isLoading) {
    return <Loading label="Đang tải thông tin..." />;
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Đặt lịch khám"
        onBack={() => router.back()}
        rightSlot={
          <TouchableOpacity activeOpacity={0.7} className="flex-row items-center gap-1">
            <MaterialIcons name="help-outline" size={18} color="white" />
            <Text className="text-[13px] font-medium text-white">Hỗ trợ</Text>
          </TouchableOpacity>
        }
      />

      {/* STEP BAR */}
      <StepBar current={1} />

      {/* SCROLL */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        enableOnAndroid
        extraScrollHeight={120}
      >
        {/* DOCTOR CARD */}
        {doctor && (
          <View
            className="mb-6 flex-row items-start gap-[14px] rounded-2xl bg-white p-4"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="relative">
              <View className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-blue-100">
                {doctor.avatarUrl ? (
                  <Image
                    source={{ uri: doctor.avatarUrl }}
                    className="h-16 w-16"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialIcons name="person" size={32} color="#60a5fa" />
                  </View>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 rounded-xl border border-slate-100 bg-white p-[3px]">
                <View className="h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                  <MaterialIcons
                    name="medical-services"
                    size={9}
                    color="white"
                  />
                </View>
              </View>
            </View>
            <View className="flex-1">
              <Text className="mb-0.5 text-xs text-gray-500">{titleLabel}</Text>
              <Text className="mb-1 text-base font-bold uppercase text-slate-900">
                {doctor.fullName ?? 'Bác sĩ'}
              </Text>
              <Text className="text-[13px] text-slate-600">
                Chuyên khoa: {specialtyLabel}
              </Text>
            </View>
          </View>
        )}

        {/* TIMELINE */}
        <View
          className="ml-2 pl-6"
          style={{ borderLeftWidth: 2, borderLeftColor: '#e5e7eb' }}
        >
          {/* STEP 1 · Bệnh nhân */}
          <View className="relative mb-8">
            <TimelineDot icon="check" />
            <Text className="mb-3 text-[15px] font-semibold text-slate-900">
              Đặt lịch khám này cho:
            </Text>
            <View
              className="overflow-hidden rounded-2xl bg-white"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}
            >
              <View className="p-4">
                <View className="mb-1 flex-row items-center gap-3 border-b border-gray-100 pb-3">
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <MaterialIcons name="person" size={24} color="#0A7CFF" />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-900">
                      {displayName}
                    </Text>
                    <View className="mt-[3px] flex-row items-center gap-[5px]">
                      <View className="h-[7px] w-[7px] rounded-full bg-green-500" />
                      <Text className="text-[11px] text-green-700">
                        Hồ sơ đang hoạt động
                      </Text>
                    </View>
                  </View>
                </View>
                <InfoRowHorizontal label="Họ và tên" value={displayName} />
                <Divider />
                <InfoRowHorizontal label="Mã bệnh nhân" value={profileCode} />
                <Divider />
                <InfoRowHorizontal label="Điện thoại" value={displayPhone} />
                {patientInfoExpanded && (
                  <>
                    <Divider />
                    <InfoRowHorizontal label="Email" value={displayEmail} />
                    <Divider />
                    <InfoRowHorizontal label="CCCD" value={displayCCCD} />
                    <Divider />
                    <InfoRowHorizontal
                      label="Giới tính"
                      value={displayGender}
                    />
                    <Divider />
                    <InfoRowHorizontal label="Ngày sinh" value={displayDOB} />
                    <Divider />
                    <InfoRowHorizontal
                      label="Quốc tịch"
                      value={displayNationality}
                    />
                    <Divider />
                    <InfoRowHorizontal
                      label="Dân tộc"
                      value={displayEthnicity}
                    />
                    <Divider />
                    <InfoRowHorizontal
                      label="Nghề nghiệp"
                      value={displayOccupation}
                    />
                    <Divider />
                    <InfoRowHorizontal
                      label="Địa chỉ chi tiết"
                      value={displayAddress}
                    />
                    <Divider />
                    <InfoRowHorizontal label="Phường/Xã" value={displayWard} />
                    <Divider />
                    <InfoRowHorizontal
                      label="Tỉnh/Thành"
                      value={displayProvince}
                    />
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setPatientInfoExpanded((prev) => !prev)}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-1 border-t border-slate-100 bg-slate-50 px-4 py-[10px]"
              >
                <Text className="text-center text-xs font-medium text-blue-500">
                  {patientInfoExpanded ? 'Thu gọn' : 'Chi tiết'}
                </Text>
                <MaterialIcons
                  name={patientInfoExpanded ? 'expand-less' : 'expand-more'}
                  size={16}
                  color="#0A7CFF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* STEP 2 · Chọn ngày & giờ khám */}
          <View className="relative mb-8">
            <TimelineDot icon="check" />
            <Text className="mb-3 text-[15px] font-semibold text-slate-900">
              Chọn ngày & giờ khám
            </Text>
            <View
              className="overflow-hidden rounded-2xl bg-white"
              style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}
            >
              <View className="px-4 pt-4">
                <View className="mb-3 flex-row items-center gap-1.5">
                  <MaterialIcons
                    name="calendar-today"
                    size={14}
                    color="#0A7CFF"
                  />
                  <Text className="text-xs font-semibold text-blue-500">
                    Tháng {parseInt(selectedDate.slice(5, 7), 10)}/
                    {selectedDate.slice(0, 4)}
                  </Text>
                </View>
                <DatePicker
                  dates={weekDates}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </View>
              <View className="px-4 pb-4 pt-5">
                {slotsQuery.isLoading ? (
                  <Loading fullscreen={false} label="Đang tải khung giờ..." />
                ) : timeSlots.length === 0 ? (
                  <View className="items-center py-6">
                    <MaterialIcons
                      name="event-busy"
                      size={36}
                      color="#d1d5db"
                    />
                    <Text className="mt-2 text-center text-[13px] text-gray-400">
                      Không có khung giờ trống cho ngày này.
                    </Text>
                  </View>
                ) : (
                  <>
                    {morning.length > 0 && (
                      <View className="mb-4">
                        <SectionLabel
                          icon="wb-sunny"
                          label="Buổi sáng"
                          color="#fb923c"
                        />
                        <TimeSlotGrid
                          slots={morning}
                          selected={selectedSlotId}
                          onSelect={setSelectedSlotId}
                        />
                      </View>
                    )}
                    {afternoon.length > 0 && (
                      <View>
                        <SectionLabel
                          icon="cloud"
                          label="Buổi chiều"
                          color="#60a5fa"
                        />
                        <TimeSlotGrid
                          slots={afternoon}
                          selected={selectedSlotId}
                          onSelect={setSelectedSlotId}
                        />
                      </View>
                    )}
                  </>
                )}
                {!selectedSlotId && timeSlots.length > 0 && (
                  <View className="mt-3 flex-row items-center gap-1.5">
                    <MaterialIcons name="touch-app" size={14} color="#d97706" />
                    <Text className="text-xs text-amber-600">
                      Vui lòng chọn một khung giờ để tiếp tục.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* STEP 3 · Thông tin bổ sung */}
          <View className="relative pb-4">
            <TimelineDot
              icon="radio-button-unchecked"
              color={showAdditionalInfo ? '#0A7CFF' : '#d1d5db'}
            />
            <Text className="mb-1 text-[15px] font-semibold text-slate-900">
              Thông tin bổ sung{' '}
              <Text className="text-[13px] font-normal text-gray-400">
                (không bắt buộc)
              </Text>
            </Text>
            <Text className="mb-4 text-[13px] leading-5 text-gray-500">
              Bạn có thể cung cấp thêm các thông tin như lý do khám, triệu
              chứng, đơn thuốc gần đây.
            </Text>

            {!showAdditionalInfo ? (
              <TouchableOpacity
                onPress={() => setShowAdditionalInfo(true)}
                activeOpacity={0.7}
                className="items-center rounded-2xl bg-white p-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  elevation: 1,
                }}
              >
                <View className="flex-row items-center gap-1">
                  <Text className="text-[13px] font-medium text-blue-500">
                    Tôi muốn gửi thêm thông tin
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={16}
                    color="#0A7CFF"
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View
                className="gap-5 rounded-2xl bg-white p-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.04,
                  elevation: 1,
                }}
              >
                <Controller
                  control={control}
                  name="chiefComplaint"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text className="mb-1.5 text-[13px] font-semibold text-slate-700">
                        Lý do khám
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Ví dụ: Ho kéo dài, đau ngực..."
                        placeholderTextColor="#9ca3af"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-[14px] py-[11px] text-sm text-slate-900"
                      />
                    </View>
                  )}
                />
                <Controller
                  control={control}
                  name="symptoms"
                  render={({ field: { onChange, value } }) => (
                    <View>
                      <Text className="mb-[3px] text-[13px] font-semibold text-slate-700">
                        Triệu chứng
                      </Text>
                      <Text className="mb-1.5 text-[11px] text-gray-400">
                        Ngăn cách bằng dấu phẩy (VD: Ho, Sốt, Khó thở)
                      </Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Ho, Sốt, Khó thở..."
                        placeholderTextColor="#9ca3af"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-[14px] py-[11px] text-sm text-slate-900"
                      />
                    </View>
                  )}
                />
                <View>
                  <Text className="mb-1.5 text-[13px] font-semibold text-slate-700">
                    Ghi chú thêm cho bác sĩ
                  </Text>
                  <View pointerEvents="box-none">
                    <RichToolbar
                      editor={richEditorRef}
                      actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.insertImage,
                      ]}
                      style={{
                        backgroundColor: '#f3f4f6',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        borderBottomWidth: 0,
                        height: 44,
                      }}
                      iconTint="#475569"
                      selectedIconTint="#0A7CFF"
                      onPressAddImage={handleInsertImage}
                    />
                  </View>
                  <View
                    className="overflow-hidden border border-gray-200 bg-gray-50"
                    style={{
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                      minHeight: editorHeight,
                    }}
                  >
                    <RichEditor
                      ref={richEditorRef}
                      initialHeight={140}
                      placeholder="Thông tin thêm, đơn thuốc đang sử dụng, tiền sử bệnh..."
                      style={{ backgroundColor: '#f9fafb' }}
                      editorStyle={{
                        backgroundColor: '#f9fafb',
                        color: '#1e293b',
                        placeholderColor: '#9ca3af',
                        contentCSSText:
                          'font-family: -apple-system, sans-serif; font-size: 14px; padding: 10px; line-height: 1.6;',
                      }}
                      scrollEnabled={false}
                      nestedScrollEnabled
                      onHeightChange={(h) => {
                        setEditorHeight(Math.max(140, h + 20));
                      }}
                      onChange={(html: string) => setPatientNotesHtml(html)}
                      useContainer
                    />
                  </View>
                  {base64ImageCount >= 5 && (
                    <View className="mt-2 flex-row items-start gap-1.5 rounded-[10px] border border-yellow-300 bg-amber-50 px-3 py-2">
                      <MaterialIcons
                        name="warning-amber"
                        size={15}
                        color="#d97706"
                        style={{ marginTop: 1 }}
                      />
                      <Text className="flex-1 text-xs leading-[18px] text-amber-900">
                        Bạn đã chèn {base64ImageCount} ảnh. Tối đa 5 ảnh mỗi lần
                        đặt lịch.
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowAdditionalInfo(false)}
                  className="items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-xs text-gray-400">Thu gọn ↑</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* FIXED CTA */}
      <View
        className={`absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3 ${Platform.OS === 'ios' ? 'pb-9' : 'pb-4'
          }`}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 6,
          elevation: 12,
        }}
      >
        {selectedLabel && (
          <Text className="mb-2 text-center text-xs text-gray-400">
            Đã chọn:{' '}
            <Text className="font-semibold text-slate-600">
              {selectedLabel}
            </Text>
          </Text>
        )}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!selectedSlotId}
          activeOpacity={0.85}
          className={`items-center justify-center rounded-[14px] py-4 ${selectedSlotId ? 'bg-blue-500' : 'bg-blue-300'
            }`}
          style={{
            shadowColor: '#0A7CFF',
            shadowOpacity: selectedSlotId ? 0.3 : 0,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: selectedSlotId ? 4 : 0,
          }}
        >
          <Text className="text-base font-bold text-white">Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default BookAppointmentScreen;
