import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccordionItem } from '@/components/doctor/AccordionItem';
import { DatePicker } from '@/components/doctor/DatePicker';
import type { DateItem } from '@/components/doctor/DatePicker';
import { DoctorDetailHeader } from '@/components/doctor/DoctorDetailHeader';
import { InfoList } from '@/components/doctor/InfoList';
import { InfoText } from '@/components/doctor/InfoText';
import { SectionLabel } from '@/components/doctor/SectionLabel';
import { TimeSlotGrid } from '@/components/doctor/TimeSlotGrid';
import type { TimeSlot } from '@/components/doctor/TimeSlotGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { theme } from '@/constants/theme';
import {
  useDoctorAvailableSlots,
  useDoctorTimeSlotSummary,
  usePublicDoctorDetail,
} from '@/hooks/useAppointments';
import type { AppointmentTypeFilter } from '@/services/appointment.service';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
type DoctorResponseDto = any;
type TimeSlotResponseDto = any;
import { getDoctorTitleLabel, getSpecialtyLabel } from '@/utils/doctor-display';
import { useCheckFavoriteDoctor, useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { useDoctorReviews } from '@/hooks/useReviews';
import { ReviewItem } from '@/components/review/ReviewItem';
import {
  buildMonthDateWindow,
  formatDate,
  formatLocalTime,
  genderLabel,
  toLocalDateString,
  toTimeSlots,
} from '@/utils/appointment-helpers';

function groupByPeriod(slots: TimeSlot[]) {
  return {
    morning: slots.filter((s) => s.period === 'morning'),
    afternoon: slots.filter((s) => s.period === 'afternoon'),
  };
}

// const BASE_DATES = buildDateWindow();
type TabType = 'appointment' | 'consultation';

export function DoctorDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('appointment');
  const [searchDate, setSearchDate] = useState(new Date());
  const baseDates = useMemo(() => buildMonthDateWindow(searchDate), [searchDate]);

  const [selectedDate, setSelectedDate] = useState(
    baseDates[0]?.date ?? toLocalDateString(new Date()),
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const doctorQuery = usePublicDoctorDetail(doctorId ?? '');
  const { data: favoriteData } = useCheckFavoriteDoctor(doctorId ?? '');
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const reviewsQuery = useDoctorReviews(doctorId ?? '');
  const isSaved = !!favoriteData;
  const appointmentTypeFilter: AppointmentTypeFilter =
    activeTab === 'consultation' ? 'online' : 'offline';

  const slotsQuery = useDoctorAvailableSlots(
    doctorId ?? '',
    selectedDate,
    appointmentTypeFilter,
  );
  const summaryQuery = useDoctorTimeSlotSummary(
    doctorId ?? '',
    baseDates[0]?.date ?? selectedDate,
    baseDates[baseDates.length - 1]?.date ?? selectedDate,
    appointmentTypeFilter,
  );

  const { refreshing, onRefresh } = useRefreshByUser(async () => {
    await Promise.all([
      doctorQuery.refetch(),
      reviewsQuery.refetch(),
      slotsQuery.refetch(),
      summaryQuery.refetch(),
    ]);
  });

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDate]);

  useEffect(() => {
    const d = new Date();
    setSearchDate(d);
    setSelectedDate(toLocalDateString(d));
    setSelectedSlotId(null);
  }, [activeTab]);

  const timeSlots = useMemo(
    () => toTimeSlots(slotsQuery.data ?? []),
    [slotsQuery.data],
  );
  const { morning, afternoon } = useMemo(
    () => groupByPeriod(timeSlots),
    [timeSlots],
  );

  const summaryMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of summaryQuery.data ?? []) {
      m.set(item.date, item.count);
    }
    return m;
  }, [summaryQuery.data]);

  const weekDates = useMemo(
    () => baseDates.map((d) => ({ ...d, slots: summaryMap.get(d.date) ?? 0 })),
    [summaryMap, baseDates],
  );

  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.id === selectedSlotId) ?? null,
    [timeSlots, selectedSlotId],
  );

  if (doctorQuery.isLoading)
    return <Loading label="Đang tải thông tin bác sĩ..." />;

  if (doctorQuery.isError || !doctorQuery.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light px-6">
        <EmptyState
          title="Không tìm thấy bác sĩ"
          description="Vui lòng quay lại danh sách bác sĩ."
        />
      </View>
    );
  }

  const doctor = doctorQuery.data as DoctorResponseDto;
  const displayName = doctor.fullName ?? 'Bác sĩ';
  const titleLabel = getDoctorTitleLabel(doctor.title);
  const specialty = getSpecialtyLabel(doctor.specialty ?? 'Chuyên khoa');
  const experience = doctor.yearsOfExperience;
  const bio = doctor.bio ?? 'Thông tin đang được cập nhật.';

  const splitLines = (val?: string | null): string[] =>
    val
      ? val
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  const workplaces = splitLines(doctor.workExperience);
  const education = splitLines(doctor.education);
  const awards = splitLines(doctor.awardsResearch);
  const expertiseNote: string = doctor.expertiseDescription ?? '';
  const address: string = doctor.address ?? '';
  const clinicDistrict: string = [doctor.ward, doctor.province]
    .filter(Boolean)
    .join(', ');
  const canChat = Boolean(currentUser?.id && doctor.userId) && !chatLoading;

  const handleChat = async () => {
    if (!currentUser?.id || !doctor.userId) return;

    try {
      setChatLoading(true);
      const room = await chatService.createOrGetRoom({
        user1Id: currentUser.id,
        user2Id: doctor.userId,
      });
      router.push({
        pathname: '/chat/[chatroomId]',
        params: { chatroomId: room.id },
      });
    } catch (error) {
      console.error('Không thể mở chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenMap = () => {
    const query = encodeURIComponent(address || 'Hồ Chí Minh');
    const url =
      Platform.OS === 'ios' ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
    void Linking.openURL(url);
  };

  const handleBook = () => {
    if (!doctorId || !selectedSlotId) return;
    router.push({
      pathname: '/appointments/book',
      params: { doctorId, date: selectedDate, slotId: selectedSlotId },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <DoctorDetailHeader
        titleLabel={titleLabel}
        displayName={displayName}
        experience={experience}
        specialty={specialty}
        avatarUrl={doctor.avatarUrl}
        isSaved={isSaved}
        canChat={canChat}
        onBack={() => router.back()}
        onToggleSave={() => {
          if (isSaved && favoriteData?.id) {
            removeFavorite.mutate(favoriteData.id);
          } else if (doctorId) {
            addFavorite.mutate({ doctorId });
          }
        }}
        onChat={handleChat}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="mb-2 bg-white px-4 pb-5 pt-4 shadow-sm">
          <View className="mb-5 flex-row rounded-xl bg-gray-100 p-1">
            {(
              [
                { key: 'appointment', label: 'Lịch khám' },
                { key: 'consultation', label: 'Lịch tư vấn' },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className="flex-1 items-center rounded-lg py-2"
                  style={
                    isActive
                      ? { backgroundColor: 'white' }
                      : { backgroundColor: 'transparent' }
                  }
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: isActive ? '#2563eb' : '#6b7280' }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setShowMonthPicker(true)}
            activeOpacity={0.7}
            className="mb-4 flex-row items-center justify-center gap-1"
          >
            <Text className="text-sm font-semibold text-blue-600">
              Tháng {parseInt(selectedDate.slice(5, 7), 10)}/
              {selectedDate.slice(0, 4)}
            </Text>
            <MaterialIcons
              name="expand-more"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <DatePicker
            dates={weekDates}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />

          <View className="mt-6">
            {slotsQuery.isLoading ? (
              <Loading fullscreen={false} label="Đang tải khung giờ..." />
            ) : timeSlots.length === 0 ? (
              <View className="py-4">
                <EmptyState
                  title="Không có khung giờ"
                  description="Vui lòng chọn ngày khác."
                />
              </View>
            ) : (
              <>
                {morning.length > 0 && (
                  <View className="mb-5">
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
                  <View className="mb-2">
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

            <View className="mt-4 flex-row items-center justify-center gap-1.5">
              <MaterialIcons name="touch-app" size={15} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {activeTab === 'consultation'
                  ? 'Chọn một khung giờ để đặt lịch tư vấn'
                  : 'Chọn một khung giờ để đặt lịch khám'}
              </Text>
            </View>
          </View>
        </View>

        {address ? (
          <View className="mb-2 overflow-hidden bg-white shadow-sm">
            <View className="flex-row items-start justify-between gap-4 p-5">
              <View className="flex-1">
                <View className="mb-1 flex-row items-center gap-2">
                  <MaterialIcons
                    name="location-on"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Địa chỉ phòng khám
                  </Text>
                </View>
                <Text className="pl-0.5 text-sm font-medium leading-relaxed text-gray-900">
                  {address}
                </Text>
                {clinicDistrict ? (
                  <Text className="mt-1 pl-0.5 text-xs text-gray-400">
                    {clinicDistrict}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleOpenMap}
                className="mt-1 shrink-0 flex-row items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 shadow-md"
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name="near-me"
                  size={18}
                  color="white"
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
                <Text className="text-xs font-bold text-white">Mở bản đồ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View className="mb-2 bg-white shadow-sm">
          <AccordionItem icon="person" title="Giới thiệu" defaultOpen>
            <InfoText>{bio}</InfoText>
          </AccordionItem>

          {workplaces.length > 0 && (
            <AccordionItem icon="domain" title="Nơi công tác">
              <InfoList items={workplaces} />
            </AccordionItem>
          )}

          {education.length > 0 && (
            <AccordionItem icon="school" title="Quá trình đào tạo">
              <InfoList items={education} />
            </AccordionItem>
          )}

          {expertiseNote ? (
            <AccordionItem icon="stars" title="Kinh nghiệm">
              <InfoText>{expertiseNote}</InfoText>
            </AccordionItem>
          ) : null}

          {awards.length > 0 && (
            <AccordionItem
              icon="workspace-premium"
              title="Giải thưởng & Nghiên cứu"
            >
              <InfoList items={awards} />
            </AccordionItem>
          )}

          <AccordionItem icon="rate-review" title={`Đánh giá (${reviewsQuery.data?.length ?? 0})`}>
            {reviewsQuery.isLoading ? (
              <Loading fullscreen={false} />
            ) : reviewsQuery.data && reviewsQuery.data.length > 0 ? (
              <View className="px-1">
                {reviewsQuery.data.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </View>
            ) : (
              <Text className="py-4 text-center text-sm text-gray-400">
                Chưa có đánh giá nào cho bác sĩ này.
              </Text>
            )}
          </AccordionItem>
        </View>

        {/* MODAL CHỌN THÁNG/NĂM */}
        <Modal visible={showMonthPicker} onRequestClose={() => setShowMonthPicker(false)}>
          <View className="w-full rounded-2xl bg-white p-6">
            <Text className="mb-4 text-center text-lg font-bold text-gray-900">Chọn thời gian</Text>
            <View className="max-h-60 flex-row">
              {/* Cột Tháng */}
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  const isCurM = m === (searchDate.getMonth() + 1);
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        const newD = new Date(searchDate);
                        newD.setMonth(i);
                        // Nếu là tháng hiện tại nhưng d < today, set d = today. 
                        // Nhưng đơn giản hơn: cứ cho phép chọn.
                        setSearchDate(newD);
                      }}
                      className={`mb-2 items-center rounded-lg py-3 ${isCurM ? 'bg-blue-50' : ''}`}
                    >
                      <Text className={`text-sm font-semibold ${isCurM ? 'text-blue-600' : 'text-gray-600'}`}>Tháng {m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {/* Cột Năm */}
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((y) => {
                  const isCurY = y === searchDate.getFullYear();
                  return (
                    <TouchableOpacity
                      key={y}
                      onPress={() => {
                        const newD = new Date(searchDate);
                        newD.setFullYear(y);
                        setSearchDate(newD);
                      }}
                      className={`mb-2 items-center rounded-lg py-3 ${isCurY ? 'bg-blue-50' : ''}`}
                    >
                      <Text className={`text-sm font-semibold ${isCurY ? 'text-blue-600' : 'text-gray-600'}`}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowMonthPicker(false);
                setSelectedDate(toLocalDateString(searchDate));
              }}
              className="mt-6 items-center rounded-xl bg-blue-600 py-4"
            >
              <Text className="text-sm font-bold text-white">Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>

      <View 
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleChat}
          disabled={!canChat}
          className="mb-3 flex-row items-center justify-center gap-2 rounded-xl border border-blue-500 py-3"
          activeOpacity={0.8}
          style={{ opacity: canChat ? 1 : 0.5 }}
        >
          <MaterialIcons
            name="chat-bubble-outline"
            size={20}
            color={theme.colors.primary}
          />
          <Text
            numberOfLines={1}
            style={{ flexShrink: 1 }}
            className="text-sm font-semibold text-blue-600"
          >
            {chatLoading ? 'Đang mở chat...' : 'Chat với bác sĩ'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleBook}
          disabled={!selectedSlotId}
          className={`flex-row items-center justify-center gap-2 rounded-xl py-3 shadow-md ${
            selectedSlotId ? 'bg-blue-600 shadow-blue-100' : 'bg-blue-300'
          }`}
          activeOpacity={0.85}
        >
          <MaterialIcons name="calendar-month" size={20} color="white" />
          <Text className="text-sm font-semibold text-white">
            {activeTab === 'consultation' ? 'Đặt lịch tư vấn' : 'Đặt lịch khám'}
          </Text>
        </TouchableOpacity>

        <Text className="mt-2 text-center text-xs text-gray-400">
          Gọi video trực tiếp: sắp ra mắt
        </Text>
        {selectedSlot && (
          <Text className="mt-2 text-center text-xs text-gray-400">
            Đã chọn: {selectedSlot.label}
          </Text>
        )}
      </View>
    </View>
  );
}

export default DoctorDetailScreen;
