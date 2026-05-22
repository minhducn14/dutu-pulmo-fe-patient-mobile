import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { CheckCircle2, AlertCircle, ChevronLeft, CalendarDays, Clock, Video, MapPin, Stethoscope } from 'lucide-react-native';
import { usePublicDoctorDetail, useDoctorAvailableSlots } from '@/hooks/useAppointments';
import { useMyPatient } from '@/hooks/useProfile';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { notifyBookingConfirmed, type ConfirmDetail } from '@/services/ai-chatbot.service';
import { theme } from '@/constants/theme';
import type { components } from '@/types/generated/patient-api';

type TimeSlotResponseDto = components['schemas']['TimeSlotResponseDto'];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingData {
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  hospitalName?: string;
  doctorRating?: number;
  date?: string;
  slot?: string;
  type?: 'VIDEO' | 'IN_PERSON';
}

interface BookingPanelProps {
  bookingData: BookingData;
  sessionId: string | null;
  messageId: string;
  onConfirm: (detail: ConfirmDetail, confirmMessage: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVietnamTime(dateString: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(dateString));
}

// ─── DoctorInfo ───────────────────────────────────────────────────────────────

function DoctorInfo({ data, doctorInfo }: { data: BookingData; doctorInfo?: any }) {
  const name = doctorInfo?.fullName || data.doctorName || 'Bác sĩ chuyên khoa';
  const spec = doctorInfo?.specialty || data.doctorSpecialty || 'Hô hấp – Phổi';
  const hosp = doctorInfo?.primaryHospital?.name || data.hospitalName || '';
  const rating = doctorInfo?.averageRating || data.doctorRating;

  return (
    <View style={styles.doctorInfoContainer}>
      <View style={styles.doctorAvatar}>
        <Stethoscope size={18} color="white" />
      </View>
      <View style={styles.doctorInfoText}>
        <Text style={styles.doctorName} numberOfLines={1}>{name}</Text>
        <Text style={styles.doctorSpec} numberOfLines={1}>
          {spec}{hosp ? ` · ${hosp}` : ''}
          {rating ? (
            <Text style={styles.ratingText}>  ★ {rating}</Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

// ─── BookingPanel ─────────────────────────────────────────────────────────────

type Step = 'select' | 'confirm' | 'submitting' | 'success' | 'error';

export const BookingPanel: React.FC<BookingPanelProps> = ({
  bookingData,
  sessionId,
  messageId,
  onConfirm,
}) => {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
      });
      return { value, label };
    });
  }, []);

  const [step, setStep] = useState<Step>('select');
  const hasAutoAdvanced = React.useRef(false);
  const [visitType, setVisitType] = useState<'VIDEO' | 'IN_PERSON'>(bookingData.type ?? 'VIDEO');
  const [selectedDate, setSelectedDate] = useState<string>(bookingData.date || '');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotResponseDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const mappedAppointmentType = visitType === 'VIDEO' ? 'online' : 'offline';

  const doctorQuery = usePublicDoctorDetail(bookingData.doctorId);
  const doctorInfo = doctorQuery.data;
  const myPatientQuery = useMyPatient();
  const createAppointmentMutation = useCreateAppointment();

  const slotsQuery = useDoctorAvailableSlots(
    bookingData.doctorId,
    selectedDate || '',
    mappedAppointmentType,
  );

  const displayedSlots = useMemo((): TimeSlotResponseDto[] => {
    if (!slotsQuery.data) return [];
    return (slotsQuery.data as TimeSlotResponseDto[]).filter((slot) => {
      const types = slot.allowedAppointmentTypes.map((t: string) => t.toUpperCase());
      if (visitType === 'VIDEO') return types.includes('VIDEO');
      return types.includes('IN_CLINIC');
    });
  }, [slotsQuery.data, visitType]);

  // Auto-select slot từ AI suggestion
  React.useEffect(() => {
    if (bookingData.slot && displayedSlots.length > 0 && !selectedSlot) {
      const matched = displayedSlots.find((s) => {
        const startTimeStr = formatVietnamTime(s.startTime);
        const aiTimeStr = bookingData.slot!.trim();
        const normalize = (t: string) => (t.length === 4 ? '0' + t : t);
        if (normalize(startTimeStr) === normalize(aiTimeStr)) return true;

        const [h, m] = aiTimeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return false;
        const aiMinutes = h * 60 + m;
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const endMinutes = end.getHours() * 60 + end.getMinutes();
        return aiMinutes >= startMinutes && aiMinutes < endMinutes;
      });
      if (matched) setSelectedSlot(matched);
    }
  }, [displayedSlots, bookingData.slot, selectedSlot]);

  // Auto-advance sang confirm nếu AI đã cung cấp đủ ngày + giờ
  React.useEffect(() => {
    if (
      selectedDate &&
      selectedSlot &&
      step === 'select' &&
      bookingData.date &&
      bookingData.slot &&
      !hasAutoAdvanced.current
    ) {
      setStep('confirm');
      hasAutoAdvanced.current = true;
    }
  }, [selectedDate, selectedSlot, step, bookingData.date, bookingData.slot]);

  const handleConfirm = async () => {
    setStep('submitting');
    setErrorMsg('');

    try {
      const patientId = myPatientQuery.data?.id;
      if (!patientId) throw new Error('Vui lòng đăng nhập với tư cách bệnh nhân để đặt lịch.');
      if (!(doctorInfo?.primaryHospital as any)?.id) throw new Error('Không tìm thấy thông tin bệnh viện của bác sĩ.');
      if (!selectedSlot) throw new Error('Chưa chọn giờ khám.');

      await createAppointmentMutation.mutateAsync({
        timeSlotId: selectedSlot.id,
        patientId,
        hospitalId: (doctorInfo?.primaryHospital as any).id as string,
        subType: 'SCHEDULED',
        sourceType: 'EXTERNAL',
        chiefComplaint: 'Khám theo AI tư vấn',
        symptoms: [],
        patientNotes: 'Đặt lịch qua AI Chatbot',
      });

      const slotDisplay = `${formatVietnamTime(selectedSlot.startTime)} - ${formatVietnamTime(selectedSlot.endTime)}`;
      const detail: ConfirmDetail = {
        doctorId: bookingData.doctorId,
        doctorName: doctorInfo?.fullName ?? bookingData.doctorName ?? 'Bác sĩ',
        selectedDate,
        selectedSlot: slotDisplay,
        visitType,
      };

      const n8nRes = await notifyBookingConfirmed({
        ...detail,
        sessionId: sessionId ?? `session-${Date.now()}`,
        messageId,
      });

      setStep('success');
      setTimeout(() => {
        onConfirm(detail, n8nRes.data.message);
      }, 1800);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message
          ? typeof err.response.data.message === 'string'
            ? err.response.data.message
            : err.response.data.message.message
          : err?.message || 'Không thể xác nhận lịch. Vui lòng thử lại.';
      setErrorMsg(errorMessage);
      setStep('error');
    }
  };

  // ── Success ──
  if (step === 'success') {
    return (
      <View style={styles.centeredState}>
        <View style={[styles.stateIcon, { backgroundColor: '#DCFCE7' }]}>
          <CheckCircle2 size={32} color="#16A34A" />
        </View>
        <Text style={styles.stateTitle}>Đặt lịch thành công!</Text>
        <Text style={styles.stateSubtitle}>
          {doctorInfo?.fullName ?? bookingData.doctorName} ·{' '}
          {selectedSlot ? formatVietnamTime(selectedSlot.startTime) : ''} · {selectedDate}
        </Text>
      </View>
    );
  }

  // ── Error ──
  if (step === 'error') {
    return (
      <View style={styles.centeredState}>
        <View style={[styles.stateIcon, { backgroundColor: '#FEE2E2' }]}>
          <AlertCircle size={28} color="#EF4444" />
        </View>
        <Text style={[styles.stateSubtitle, { color: '#374151', textAlign: 'center' }]}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => setStep('confirm')}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Confirm / Submitting ──
  if (step === 'confirm' || step === 'submitting') {
    const isSubmitting = step === 'submitting';
    return (
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <TouchableOpacity
            onPress={() => !isSubmitting && setStep('select')}
            disabled={isSubmitting}
            style={[styles.backBtn, isSubmitting && { opacity: 0.4 }]}
          >
            <ChevronLeft size={18} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Xác nhận lịch khám</Text>
        </View>

        <DoctorInfo data={bookingData} doctorInfo={doctorInfo} />

        <View style={styles.confirmRows}>
          {[
            { icon: <CalendarDays size={15} color={theme.colors.primary} />, label: 'Ngày khám', value: selectedDate },
            {
              icon: <Clock size={15} color={theme.colors.primary} />,
              label: 'Giờ khám',
              value: selectedSlot
                ? `${formatVietnamTime(selectedSlot.startTime)} - ${formatVietnamTime(selectedSlot.endTime)}`
                : '',
            },
            {
              icon: visitType === 'VIDEO'
                ? <Video size={15} color={theme.colors.primary} />
                : <MapPin size={15} color={theme.colors.primary} />,
              label: 'Hình thức',
              value: visitType === 'VIDEO' ? 'Video call' : 'Trực tiếp',
            },
          ].map((row) => (
            <View key={row.label} style={styles.confirmRow}>
              <View style={styles.confirmRowLeft}>
                {row.icon}
                <Text style={styles.confirmRowLabel}>{row.label}</Text>
              </View>
              <Text style={styles.confirmRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isSubmitting}
          style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <View style={styles.btnRow}>
              <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Đang xác nhận...</Text>
            </View>
          ) : (
            <Text style={styles.primaryBtnText}>Xác nhận đặt lịch</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // ── Select ──
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Chọn lịch khám</Text>

      <DoctorInfo data={bookingData} doctorInfo={doctorInfo} />

      {/* Visit type */}
      <View style={styles.visitTypeRow}>
        {([
          { key: 'VIDEO' as const, icon: <Video size={13} color={visitType === 'VIDEO' ? theme.colors.primary : '#94A3B8'} />, label: 'Video call' },
          { key: 'IN_PERSON' as const, icon: <MapPin size={13} color={visitType === 'IN_PERSON' ? theme.colors.primary : '#94A3B8'} />, label: 'Trực tiếp' },
        ]).map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => { setVisitType(key); setSelectedSlot(null); }}
            style={[styles.visitTypeBtn, visitType === key && styles.visitTypeBtnActive]}
          >
            {icon}
            <Text style={[styles.visitTypeBtnText, visitType === key && styles.visitTypeBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date picker */}
      <Text style={styles.sectionLabel}>CHỌN NGÀY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {days.map((d, i) => {
          const active = selectedDate === d.value;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
              style={[styles.dateBtn, active && styles.dateBtnActive]}
            >
              <Text style={[styles.dateBtnText, active && styles.dateBtnTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time slots */}
      {selectedDate && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>CHỌN GIỜ</Text>
          {slotsQuery.isLoading ? (
            <View style={styles.slotsLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.slotsLoadingText}>Đang tải...</Text>
            </View>
          ) : displayedSlots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {displayedSlots.map((s) => {
                const isSelected = selectedSlot?.id === s.id;
                const remaining = Math.max(s.capacity - s.bookedCount, 0);
                const disabled = remaining === 0;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => !disabled && setSelectedSlot(s)}
                    disabled={disabled}
                    style={[
                      styles.slotBtn,
                      isSelected && styles.slotBtnActive,
                      disabled && styles.slotBtnDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.slotBtnText,
                      isSelected && styles.slotBtnTextActive,
                      disabled && styles.slotBtnTextDisabled,
                    ]}>
                      {formatVietnamTime(s.startTime)} - {formatVietnamTime(s.endTime)}
                    </Text>
                    <Text style={[styles.slotRemaining, disabled && styles.slotBtnTextDisabled]}>
                      Còn {remaining} chỗ
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noSlots}>
              <Text style={styles.noSlotsText}>Không có lịch trống</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={() => setStep('confirm')}
        disabled={!selectedDate || !selectedSlot}
        style={[styles.primaryBtn, (!selectedDate || !selectedSlot) && styles.primaryBtnDisabled]}
        activeOpacity={0.85}
      >
        <Text style={[styles.primaryBtnText, (!selectedDate || !selectedSlot) && { color: '#94A3B8' }]}>
          Tiếp tục →
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  panel: {
    padding: 14,
    gap: 12,
    flexDirection: 'column',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  backBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  // Doctor info
  doctorInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 10,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfoText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  doctorSpec: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingText: {
    color: '#F59E0B',
  },
  // Visit type
  visitTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  visitTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  visitTypeBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  visitTypeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  visitTypeBtnTextActive: {
    color: '#2563EB',
  },
  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  // Date scroll
  dateScroll: {
    flexGrow: 0,
  },
  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    marginRight: 8,
  },
  dateBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#2563EB',
  },
  dateBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  dateBtnTextActive: {
    color: 'white',
  },
  // Slots
  slotsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  slotsLoadingText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  slotsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  slotBtn: {
    width: '47%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    alignItems: 'center' as const,
  },
  slotBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  slotBtnDisabled: {
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  slotBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  slotBtnTextActive: {
    color: '#2563EB',
  },
  slotBtnTextDisabled: {
    color: '#CBD5E1',
  },
  slotRemaining: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  noSlotsText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Confirm
  confirmRows: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  confirmRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmRowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  // Primary button
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // States
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 10,
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  stateSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
