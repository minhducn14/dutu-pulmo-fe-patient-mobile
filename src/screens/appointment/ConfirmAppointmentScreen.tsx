import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import RenderHtml from 'react-native-render-html';

import { Loading } from '@/components/ui/Loading';
import { StepBar } from '@/components/appointment/StepBar';
import { SupportItem } from '@/components/appointment/SupportItem';
import { InfoRowVertical, InfoRowVerticalTwo } from '@/components/appointment/InfoRowVertical';
import { formatDate, genderLabel, formatWeekdayDate } from '@/utils/appointment-helpers';
import {
  useCreateAppointment,
  usePublicDoctorDetail,
} from '@/hooks/useAppointments';
import { useMyPatient, useProfile } from '@/hooks/useProfile';
import { useBookingStore } from '@/store/booking.store';
import { useAuthStore } from '@/store/auth.store';
import { getDoctorTitleLabel, getSpecialtyLabel } from '@/utils/doctor-display';

// ══════════════════════════════════════════════════════════════════════════════
export function ConfirmAppointmentScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const draft = useBookingStore((s) => s.draft);
  const clearDraft = useBookingStore((s) => s.clearDraft);
  const user = useAuthStore((s) => s.user);

  const [patientInfoExpanded, setPatientInfoExpanded] = useState(true);
  const [additionalInfoExpanded, setAdditionalInfoExpanded] = useState(true);

  const meQuery = useProfile();
  const myPatientQuery = useMyPatient();
  const doctorQuery = usePublicDoctorDetail(draft?.doctorId ?? '');
  const createMutation = useCreateAppointment();

  // Guard: nếu không có draft → back
  if (!draft) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <MaterialIcons name="error-outline" size={48} color="#cbd5e1" />
        <Text className="mt-3 text-[15px] text-slate-400">
          Không tìm thấy thông tin đặt lịch
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-blue-500 px-6 py-[10px]"
        >
          <Text className="font-semibold text-white">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (doctorQuery.isLoading || meQuery.isLoading) {
    return <Loading label="Đang tải thông tin..." />;
  }

  const doctor = doctorQuery.data;
  const me = meQuery.data;
  const myPatient = myPatientQuery.data;

  const titleLabel = doctor ? getDoctorTitleLabel(doctor.title) : '';
  const specialtyLabel = doctor ? getSpecialtyLabel(doctor.specialty ?? '') : '';

  const displayName = me?.patient?.user?.fullName ?? user?.fullName ?? '—';
  const displayGender = genderLabel(me?.patient?.user?.gender);
  const displayDOB = formatDate(me?.patient?.user?.dateOfBirth);
  const displayPhone = me?.patient?.user?.phone ?? '—';
  const profileCode = myPatient?.profileCode ?? '—';
  const avatarUrl = me?.patient?.user?.avatarUrl ?? user?.avatarUrl;

  const isMorning = draft.period === 'morning';
  const periodLabel = isMorning ? 'Buổi sáng' : 'Buổi chiều';
  const periodDotClass = isMorning ? 'bg-green-600' : 'bg-blue-600';
  const periodTextClass = isMorning ? 'text-green-700' : 'text-blue-700';

  // Kiểm tra có thông tin bổ sung không
  const hasAdditionalInfo =
    !!draft.chiefComplaint || !!draft.symptoms || !!draft.patientNotes;

  const onConfirm = () => {
    createMutation.mutate(
      {
        timeSlotId: draft.slotId,
        chiefComplaint: draft.chiefComplaint || undefined,
        symptoms: draft.symptoms
          ? draft.symptoms
              .split(',')
              .map((i) => i.trim())
              .filter(Boolean)
          : undefined,
        patientNotes: draft.patientNotes || undefined,
      },
      {
        onSuccess: (appointment) => {
          clearDraft();
          router.replace(
            `/appointments/payment?appointmentId=${appointment.id}&amount=0`,
          );
        },
        onError: () => {
          Alert.alert('Lỗi', 'Không thể tạo lịch khám. Vui lòng thử lại.');
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View className="flex-row items-center justify-between bg-blue-500 px-4 pb-4 pt-12">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="rounded-full p-1"
        >
          <MaterialIcons name="arrow-back-ios-new" size={22} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Xác nhận thông tin</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-1"
        >
          <MaterialIcons name="help-outline" size={18} color="white" />
          <Text className="text-[13px] font-medium text-white">Hỗ trợ</Text>
        </TouchableOpacity>
      </View>

      {/* STEP BAR */}
      <StepBar current={2} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-[120px]"
        showsVerticalScrollIndicator={false}
      >
        {/* ── THÔNG TIN ĐĂNG KÝ ── */}
        <View className="px-4 pt-4">
          <Text className="mb-[10px] text-[11px] font-bold tracking-[0.8px] text-slate-400">
            THÔNG TIN ĐĂNG KÝ
          </Text>

          <View
            className="overflow-hidden rounded-2xl bg-white"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Doctor row */}
            <View className="flex-row items-center gap-3 border-b border-slate-100 p-4">
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
                <Text className="text-xs text-gray-500">{titleLabel}</Text>
                <Text className="text-[15px] font-bold uppercase text-slate-900">
                  {doctor?.fullName ?? 'Bác sĩ'}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-600">
                  Chuyên khoa: {specialtyLabel}
                </Text>
              </View>
            </View>

            {/* Time & date */}
            <View className="flex-row border-b border-slate-100 p-4">
              <View className="flex-1">
                <Text className="mb-1 text-xs text-slate-400">Giờ khám</Text>
                <Text className="text-[17px] font-bold text-slate-900">
                  {draft.slotLabel}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <View className={`h-1.5 w-1.5 rounded-full ${periodDotClass}`} />
                  <Text className={`text-xs font-medium ${periodTextClass}`}>
                    {periodLabel}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-xs text-slate-400">Ngày khám</Text>
                <Text className="text-[17px] font-bold text-slate-900">
                  {formatWeekdayDate(draft.date)}
                </Text>
              </View>
            </View>

            {/* Patient info — collapsible */}
            <Pressable
              onPress={() => setPatientInfoExpanded(!patientInfoExpanded)}
              className={`flex-row items-center px-4 py-3 ${
                patientInfoExpanded ? 'border-b border-slate-100' : ''
              }`}
            >
              <Text className="flex-1 text-[11px] font-bold tracking-[0.8px] text-slate-400">
                THÔNG TIN BỆNH NHÂN
              </Text>
              <MaterialIcons
                name={patientInfoExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color="#94a3b8"
              />
            </Pressable>

            {patientInfoExpanded && (
              <View className="p-4">
                <InfoRowVertical label="Họ và tên" value={displayName} />
                <InfoRowVerticalTwo
                  items={[
                    { label: 'Giới tính', value: displayGender },
                    { label: 'Ngày sinh', value: displayDOB },
                  ]}
                />
                <InfoRowVerticalTwo
                  items={[
                    { label: 'Điện thoại liên hệ', value: displayPhone },
                    { label: 'Mã bảo hiểm y tế', value: myPatient?.insuranceNumber ?? '--' },
                  ]}
                />
                <InfoRowVertical label="Mã căn cước công dân" value="--" />
                <InfoRowVertical label="Địa chỉ" value="--" />
              </View>
            )}
          </View>
        </View>

        {/* ── THÔNG TIN BỔ SUNG ── */}
        {hasAdditionalInfo && (
          <View className="mt-5 px-4">
            <Text className="mb-[10px] text-[11px] font-bold tracking-[0.8px] text-slate-400">
              THÔNG TIN BỔ SUNG
            </Text>

            <View
              className="overflow-hidden rounded-2xl bg-white"
              style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Header toggle */}
              <Pressable
                onPress={() => setAdditionalInfoExpanded(!additionalInfoExpanded)}
                className={`flex-row items-center px-4 py-3 ${
                  additionalInfoExpanded ? 'border-b border-slate-100' : ''
                }`}
              >
                <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-blue-50">
                  <MaterialIcons name="note-alt" size={14} color="#0A7CFF" />
                </View>
                <Text className="flex-1 text-[13px] font-semibold text-slate-700">
                  Thông tin gửi cho bác sĩ
                </Text>
                <MaterialIcons
                  name={additionalInfoExpanded ? 'expand-less' : 'expand-more'}
                  size={20}
                  color="#94a3b8"
                />
              </Pressable>

              {additionalInfoExpanded && (
                <View className="p-4 gap-4">
                  {/* Lý do khám */}
                  {!!draft.chiefComplaint && (
                    <View>
                      <Text className="mb-1 text-[11px] font-bold tracking-[0.6px] text-slate-400">
                        LÝ DO KHÁM
                      </Text>
                      <Text className="text-[14px] leading-[22px] text-slate-700">
                        {draft.chiefComplaint}
                      </Text>
                    </View>
                  )}

                  {/* Triệu chứng */}
                  {!!draft.symptoms && (
                    <View>
                      <Text className="mb-2 text-[11px] font-bold tracking-[0.6px] text-slate-400">
                        TRIỆU CHỨNG
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {draft.symptoms
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((symptom, idx) => (
                            <View
                              key={idx}
                              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1"
                            >
                              <Text className="text-[12px] font-medium text-blue-700">
                                {symptom}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}

                  {/* Ghi chú thêm — render HTML */}
                  {!!draft.patientNotes && (
                    <View>
                      <Text className="mb-2 text-[11px] font-bold tracking-[0.6px] text-slate-400">
                        GHI CHÚ THÊM
                      </Text>
                      <View className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <RenderHtml
                          contentWidth={width - 80}
                          source={{ html: draft.patientNotes }}
                          tagsStyles={{
                            body: {
                              color: '#334155',
                              fontSize: 14,
                              lineHeight: 22,
                              margin: 0,
                              padding: 0,
                            },
                            p: { marginTop: 0, marginBottom: 4 },
                            ul: { marginTop: 0, marginBottom: 4, paddingLeft: 16 },
                            ol: { marginTop: 0, marginBottom: 4, paddingLeft: 16 },
                            li: { marginBottom: 2 },
                            strong: { fontWeight: '700' },
                            em: { fontStyle: 'italic' },
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── CHI TIẾT THANH TOÁN ── */}
        <View className="mt-5 px-4">
          <View className="mb-[10px] flex-row items-center justify-between">
            <Text className="text-[11px] font-bold tracking-[0.8px] text-slate-400">
              CHI TIẾT THANH TOÁN
            </Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <Text className="text-xs text-slate-500">Giải thích</Text>
              <View className="h-4 w-4 items-center justify-center rounded-full bg-slate-400">
                <Text className="text-[9px] font-bold text-white">?</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View
            className="rounded-2xl bg-white p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}
          >
            <View className="flex-row justify-between border-b border-slate-50 py-[10px]">
              <Text className="text-sm text-gray-700">Phí khám</Text>
              <Text className="text-sm text-gray-700">
                {draft.finalConsultationFee?.toLocaleString('vi-VN')}đ
              </Text>
            </View>
            <View className="flex-row justify-between border-b border-slate-50 py-[10px]">
              <Text className="text-sm text-gray-700">Phí tiện ích</Text>
              <Text className="text-sm font-medium text-green-500">Miễn phí</Text>
            </View>
            <View className="flex-row justify-between py-[10px]">
              <Text className="text-[15px] font-bold text-slate-900">Tổng thanh toán</Text>
              <Text className="text-[15px] font-bold text-slate-900">
                {draft.finalConsultationFee?.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>
        </View>

        {/* ── HỖ TRỢ ── */}
        <View className="mt-6 px-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">
            Hỗ trợ đặt khám
          </Text>
          <View
            className="rounded-2xl bg-white px-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, elevation: 1 }}
          >
            <SupportItem icon="chat-bubble-outline" label="Chat với CSKH" />
            <SupportItem icon="description" label="Hướng dẫn đi khám" />
            <SupportItem icon="payment" label="Hướng dẫn thanh toán" />
            <SupportItem icon="sync" label="Quy trình huỷ lịch / hoàn tiền" />
            <SupportItem icon="help-outline" label="Một số câu hỏi thường gặp" />
            <View className="border-b-0">
              <SupportItem icon="report-problem" label="Báo cáo sự cố" />
            </View>
          </View>
        </View>

        {/* ── SECURITY NOTES ── */}
        <View className="mt-5 gap-[10px] px-4">
          <View className="flex-row items-start gap-2">
            <MaterialIcons
              name="security"
              size={16}
              color="#94a3b8"
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-xs leading-[18px] text-slate-400">
              Bằng việc đăng ký / thanh toán bạn đã đọc và đồng ý với các{' '}
              <Text className="text-blue-500">điều khoản và điều kiện sử dụng</Text>{' '}
              của chúng tôi.
            </Text>
          </View>
          <View className="flex-row items-start gap-2">
            <MaterialIcons
              name="lock"
              size={16}
              color="#94a3b8"
              style={{ marginTop: 1 }}
            />
            <Text className="flex-1 text-xs leading-[18px] text-slate-400">
              Mọi thông tin giao dịch được bảo mật đường truyền internet theo
              các tiêu chuẩn quốc tế SSL/TLS.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FIXED CTA */}
      <View
        className={`absolute bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pt-3 ${
          Platform.OS === 'ios' ? 'pb-9' : 'pb-4'
        }`}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 8,
          elevation: 16,
        }}
      >
        <TouchableOpacity
          onPress={onConfirm}
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
          {!createMutation.isPending && (
            <MaterialIcons name="lock" size={18} color="white" />
          )}
          <Text className="text-base font-bold text-white">
            {createMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ConfirmAppointmentScreen;