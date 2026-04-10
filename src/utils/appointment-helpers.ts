import type { DateItem } from '@/components/doctor/DatePicker';
import type { TimeSlot } from '@/components/doctor/TimeSlotGrid';
import type { components } from '@/types/generated/patient-api';

type TimeSlotResponseDto = components['schemas']['TimeSlotResponseDto'];

// ─── Date window helpers ──────────────────────────────────────────────────────
export const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const DATE_WINDOW_DAYS = 14;

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDateWindow(startDate = new Date(), days = DATE_WINDOW_DAYS): DateItem[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return {
      label: DAY_LABELS[d.getDay()],
      day: d.getDate(),
      date: toLocalDateString(d),
      slots: 0,
    };
  });
}

export function buildMonthDateWindow(searchDate: Date): DateItem[] {
  const now = new Date();
  const targetYear = searchDate.getFullYear();
  const targetMonth = searchDate.getMonth();

  const isCurrentMonth =
    targetYear === now.getFullYear() && targetMonth === now.getMonth();

  const startDay = isCurrentMonth ? now.getDate() : 1;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const numDays = lastDay - startDay + 1;

  return Array.from({ length: numDays }, (_, i) => {
    const d = new Date(targetYear, targetMonth, startDay + i);
    return {
      label: DAY_LABELS[d.getDay()],
      day: d.getDate(),
      date: toLocalDateString(d),
      slots: 0,
    };
  });
}

// ─── Slot helpers ─────────────────────────────────────────────────────────────
export function formatLocalTime(utcStr: string): string {
  const d = new Date(utcStr);
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function toTimeSlots(apiSlots: TimeSlotResponseDto[]): TimeSlot[] {
  return apiSlots.map((s) => {
    const localHour = new Date(s.startTime).getHours();
    return {
      id: s.id,
      label: `${formatLocalTime(s.startTime)} - ${formatLocalTime(s.endTime)}`,
      startTime: s.startTime,
      endTime: s.endTime,
      period: localHour < 12 ? 'morning' : 'afternoon',
      allowedAppointmentTypes: s.allowedAppointmentTypes as any,
    };
  });
}

// ─── Display formatters ───────────────────────────────────────────────────────
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

export function formatWeekdayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${weekdays[d.getDay()]} ${d.toLocaleDateString('vi-VN')}`;
}

export function genderLabel(gender?: string | null): string {
  if (!gender) return '—';
  return (
    ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' } as Record<string, string>)[
      gender
    ] ?? gender
  );
}
