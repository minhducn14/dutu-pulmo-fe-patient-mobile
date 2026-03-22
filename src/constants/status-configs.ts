export interface StatusConfig {
  label: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const APPOINTMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  CONFIRMED: {
    label: 'Đã đặt lịch',
    icon: 'check-circle',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
  PENDING: {
    label: 'Chờ xác nhận',
    icon: 'schedule',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    icon: 'payment',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    icon: 'done-all',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: 'cancel',
    color: '#ef4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-500',
  },
  CHECKED_IN: {
    label: 'Đã check-in',
    icon: 'how-to-reg',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    icon: 'medical-services',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  RESCHEDULED: {
    label: 'Đã đổi lịch',
    icon: 'event-repeat',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  NO_SHOW: {
    label: 'Vắng mặt',
    icon: 'person-off',
    color: '#64748b',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-600',
  },
};

export const FALLBACK_APPOINTMENT_STATUS = APPOINTMENT_STATUS_CONFIG.PENDING;

export const MEDICAL_RECORD_STATUS_CONFIG: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Đang xử lý',
    icon: 'edit-note',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    icon: 'medical-services',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    icon: 'done-all',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
};

export const FALLBACK_MEDICAL_RECORD_STATUS = MEDICAL_RECORD_STATUS_CONFIG.DRAFT;

export const PRESCRIPTION_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: {
    label: 'Đang dùng',
    icon: 'medication',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    icon: 'done-all',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  CANCELLED: {
    label: 'Đã hủy',
    icon: 'cancel',
    color: '#ef4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-500',
  },
};

export const FALLBACK_PRESCRIPTION_STATUS = PRESCRIPTION_STATUS_CONFIG.ACTIVE;

export const REPORT_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Chờ xử lý',
    icon: 'schedule',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
  },
  in_progress: {
    label: 'Đang xử lý',
    icon: 'autorenew',
    color: '#0A7CFF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-600',
  },
  resolved: {
    label: 'Đã giải quyết',
    icon: 'check-circle',
    color: '#16a34a',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-700',
  },
  rejected: {
    label: 'Đã từ chối',
    icon: 'cancel',
    color: '#ef4444',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-500',
  },
};

