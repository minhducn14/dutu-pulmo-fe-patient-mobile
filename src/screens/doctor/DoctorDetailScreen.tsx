import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import {
  useDoctorAvailableSlots,
  useDoctorTimeSlotSummary,
  usePublicDoctorDetail,
} from '@/hooks/useAppointments';
import { theme } from '@/constants/theme';
import { chatService } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import type {
  DoctorResponseDto,
  TimeSlotResponseDto,
} from '@/types/generated/patient-api';

interface DateItem {
  label: string;
  day: number;
  date: string;
  slots: number;
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  period: 'morning' | 'afternoon';
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DATE_WINDOW_DAYS = 14;

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateWindow(days = DATE_WINDOW_DAYS): DateItem[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: DAY_LABELS[d.getDay()],
      day: d.getDate(),
      date: toLocalDateString(d),
      slots: 0,
    };
  });
}

function groupByPeriod(slots: TimeSlot[]) {
  return {
    morning: slots.filter((s) => s.period === 'morning'),
    afternoon: slots.filter((s) => s.period === 'afternoon'),
  };
}

function formatLocalTime(utcStr: string): string {
  const d = new Date(utcStr);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function toTimeSlots(apiSlots: TimeSlotResponseDto[]): TimeSlot[] {
  return apiSlots.map((s) => {
    const start = new Date(s.startTime);
    const localHour = start.getHours();
    return {
      id: s.id,
      label: `${formatLocalTime(s.startTime)} - ${formatLocalTime(s.endTime)}`,
      startTime: s.startTime,
      endTime: s.endTime,
      period: localHour < 12 ? 'morning' : 'afternoon',
    };
  });
}

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getDoctorTitleLabel(title?: string): string {
  if (!title) return 'BS';

  const titleCodeMap: Record<string, string> = {
    SPECIALIST_DOCTOR_1: 'BS. CK1',
    SPECIALIST_DOCTOR_2: 'BS. CK2',
    MASTER: 'ThS. BS',
    MASTER_DOCTOR: 'ThS. BS',
    DOCTOR_ASSOCIATE_PROFESSOR: 'PGS. TS',
    ASSOCIATE_PROFESSOR_PHD_DOCTOR: 'PGS. TS',
    DOCTOR_PROFESSOR: 'GS. TS',
    PROFESSOR_PHD_DOCTOR: 'GS. TS',
    PHD: 'TS. BS',
    PHD_DOCTOR: 'TS. BS',
    DOCTOR: 'BS',
  };

  if (titleCodeMap[title]) return titleCodeMap[title];

  const normalized = normalizeText(title);
  if (normalized.includes('pho giao su')) return 'PGS. TS';
  if (normalized.includes('giao su')) return 'GS. TS';
  if (normalized.includes('chuyen khoa 2')) return 'BS. CK2';
  if (normalized.includes('chuyen khoa 1')) return 'BS. CK1';
  if (normalized.includes('thac si')) return 'ThS. BS';
  if (normalized.includes('tien si')) return 'TS. BS';

  return title;
}

function SlotBadge({ count }: { count: number }) {
  const active = count > 0;
  return (
    <View
      className={`mt-1 rounded-full px-2 py-0.5 ${
        active ? 'bg-emerald-500' : 'bg-gray-100'
      }`}
    >
      <Text
        className={`text-[10px] font-bold ${
          active ? 'text-white' : 'text-gray-400'
        }`}
        numberOfLines={1}
      >
        {count > 0 ? `${count} slot` : '0 slot'}
      </Text>
    </View>
  );
}

function DatePicker({
  dates,
  selected,
  onSelect,
}: {
  dates: DateItem[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 12,
        paddingHorizontal: 4,
        paddingBottom: 8,
      }}
    >
      {dates.map((item) => {
        const isSelected = item.date === selected;
        return (
          <TouchableOpacity
            key={item.date}
            onPress={() => onSelect(item.date)}
            className="items-center"
            style={{ minWidth: 52 }}
          >
            <Text
              className={`mb-1 text-xs font-semibold ${
                isSelected ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {item.label}
            </Text>
            <View
              className={`h-11 w-11 items-center justify-center rounded-full ${
                isSelected
                  ? 'border border-blue-400 bg-blue-50'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  isSelected ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {item.day}
              </Text>
            </View>
            <SlotBadge count={item.slots} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function TimeSlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <View className="flex-row flex-wrap gap-3">
      {slots.map((slot) => {
        const isSelected = slot.id === selected;
        return (
          <TouchableOpacity
            key={slot.id}
            onPress={() => onSelect(slot.id)}
            className={`rounded-lg border px-3 py-2.5 ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
            style={{ minWidth: 108 }}
          >
            <Text
              className={`text-center text-xs font-semibold ${
                isSelected ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {slot.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SectionLabel({
  icon,
  label,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View className="mb-3 flex-row items-center gap-2">
      <MaterialIcons name={icon} size={18} color={color} />
      <Text className="text-sm font-semibold text-gray-800">{label}</Text>
    </View>
  );
}

function AccordionItem({
  icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="border-b border-gray-100">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-4"
        android_ripple={{ color: '#e5e7eb' }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
            <MaterialIcons name={icon} size={18} color={theme.colors.primary} />
          </View>
          <Text className="text-[15px] font-semibold text-gray-900">
            {title}
          </Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color={open ? theme.colors.primary : '#9ca3af'}
        />
      </Pressable>
      {open && <View className="px-4 pb-5 pl-[3.5rem]">{children}</View>}
    </View>
  );
}

function InfoText({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-sm leading-relaxed text-gray-600">{children}</Text>
  );
}

function InfoList({ items }: { items: string[] }) {
  return (
    <View className="gap-1.5">
      {items.map((item, i) => (
        <View key={`${item}-${i}`} className="flex-row gap-2">
          <Text className="text-sm text-gray-400"></Text>
          <Text className="flex-1 text-sm leading-relaxed text-gray-600">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const BASE_DATES = buildDateWindow();
type TabType = 'appointment' | 'consultation';

export function DoctorDetailScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('appointment');
  const [selectedDate, setSelectedDate] = useState(
    BASE_DATES[0]?.date ?? toLocalDateString(new Date()),
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const currentUser = useAuthStore((s) => s.user);

  const doctorQuery = usePublicDoctorDetail(doctorId ?? '');
  const slotsQuery = useDoctorAvailableSlots(doctorId ?? '', selectedDate);
  const summaryQuery = useDoctorTimeSlotSummary(
    doctorId ?? '',
    BASE_DATES[0]?.date ?? selectedDate,
    BASE_DATES[BASE_DATES.length - 1]?.date ?? selectedDate,
  );

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDate]);

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
    () => BASE_DATES.map((d) => ({ ...d, slots: summaryMap.get(d.date) ?? 0 })),
    [summaryMap],
  );

  const selectedSlot = useMemo(
    () => timeSlots.find((s) => s.id === selectedSlotId) ?? null,
    [timeSlots, selectedSlotId],
  );

  if (doctorQuery.isLoading) {
    return <Loading label="Đang tải thông tin bác sĩ..." />;
  }

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

  const displayName = doctor.fullName ?? 'Bac si';
  const titleLabel = getDoctorTitleLabel(doctor.title);
  const specialty = doctor.specialty ?? 'Chuyen khoa';
  const experience = doctor.yearsOfExperience;
  const bio = doctor.bio ?? 'Thong tin dang duoc cap nhat.';

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
      console.error('Khong the mo chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleOpenMap = () => {
    const query = encodeURIComponent(address || 'Ho Chi Minh');
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
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.primary,
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <MaterialIcons name="arrow-back-ios" size={20} color="white" />
            </Pressable>
            <Text className="text-lg font-semibold text-white">
              Thông tin bác sĩ
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => setIsSaved((v) => !v)}
              className="flex-row items-center gap-1"
            >
              <MaterialIcons
                name={isSaved ? 'favorite' : 'favorite-border'}
                size={20}
                color={isSaved ? '#FDE047' : 'white'}
              />
              <Text className="text-xs font-medium text-white">
                {isSaved ? 'Đã lưu' : 'Lưu lại'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleChat}
              disabled={!canChat}
              className="flex-row items-center gap-1"
              style={{ opacity: canChat ? 1 : 0.5 }}
            >
              <MaterialIcons name="help-outline" size={20} color="white" />
              <Text className="text-xs font-medium text-white">Hỗ trợ</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white px-4 py-5 shadow-sm mb-2">
          <View className="flex-row gap-4">
            <View className="relative">
              <Avatar uri={doctor.avatarUrl} size={80} />
              <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-white">
                <MaterialIcons name="videocam" size={12} color="white" />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500">
                {titleLabel}
              </Text>
              <Text className="text-xl font-extrabold text-gray-900 uppercase leading-tight mt-0.5">
                {displayName}
              </Text>
              <View className="flex-row items-center gap-1 mt-1">
                <MaterialIcons
                  name="verified"
                  size={15}
                  color={theme.colors.primary}
                />
                <Text className="text-sm font-semibold text-blue-600">
                  Bác sĩ
                </Text>
              </View>
              {experience ? (
                <Text className="mt-0.5 text-sm text-gray-500">
                  {experience} năm kinh nghiệm
                </Text>
              ) : null}
            </View>
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            <Text className="text-sm text-gray-500">Chuyên khoa:</Text>
            <View className="rounded-full bg-blue-50 px-3 py-1">
              <Text className="text-sm font-semibold text-blue-600">
                {specialty}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white px-4 pb-5 pt-4 mb-2 shadow-sm">
          <View className="flex-row rounded-xl bg-gray-100 p-1 mb-5">
            {(
              [
                { key: 'appointment', label: 'Lịch khám' },
                { key: 'consultation', label: 'Lịch tư vấn' },
              ] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 items-center rounded-lg py-2 ${
                  activeTab === tab.key
                    ? 'bg-white shadow-sm'
                    : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row items-center justify-center gap-1 mb-4">
            <Text className="text-sm font-semibold text-blue-600">
              Tháng {parseInt(selectedDate.slice(5, 7), 10)}/
              {selectedDate.slice(0, 4)}
            </Text>
            <MaterialIcons
              name="expand-more"
              size={20}
              color={theme.colors.primary}
            />
          </View>

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
                Chọn một khung giờ để đặt lịch
              </Text>
            </View>
          </View>
        </View>

        {address ? (
          <View className="bg-white mb-2 shadow-sm overflow-hidden">
            <View className="p-5 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <MaterialIcons
                    name="location-on"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Địa chỉ phòng khám
                  </Text>
                </View>
                <Text className="text-sm font-medium leading-relaxed text-gray-900 pl-0.5">
                  {address}
                </Text>
                {clinicDistrict ? (
                  <Text className="mt-1 text-xs text-gray-400 pl-0.5">
                    {clinicDistrict}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleOpenMap}
                className="shrink-0 flex-row items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 shadow-md mt-1"
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

        <View className="bg-white mb-2 shadow-sm">
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
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/appointments',
                params: { doctorId, type: 'VIDEO' },
              })
            }
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 shadow-md shadow-emerald-100"
            activeOpacity={0.85}
          >
            <MaterialIcons name="videocam" size={20} color="white" />
            <Text className="text-sm font-semibold text-white">Gọi video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBook}
            disabled={!selectedSlotId}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 shadow-md ${
              selectedSlotId ? 'bg-blue-600 shadow-blue-100' : 'bg-blue-300'
            }`}
            activeOpacity={0.85}
          >
            <MaterialIcons name="calendar-month" size={20} color="white" />
            <Text className="text-sm font-semibold text-white">Đặt khám</Text>
          </TouchableOpacity>
        </View>

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
