// Auto-generated contract snapshot for patient-mobile from backend DTOs.
// Source of truth: du-tu-pulmo_be (controllers + DTOs + enums).

export type PaginationMeta = {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResponseDto<T> = {
  items: T[];
  meta: PaginationMeta;
};

export enum RoleEnum {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  PATIENT = "PATIENT",
  SYSTEM = "SYSTEM",
  RECEPTIONIST = "RECEPTIONIST",
}

export enum UserStatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type AuthUserResponseDto = {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  status?: UserStatusEnum;
  doctorId?: string;
  patientId?: string;
};

export type AuthAccountResponseDto = {
  id: string;
  email: string;
  roles: RoleEnum[];
  isVerified: boolean;
  user: AuthUserResponseDto;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponseDto = {
  accessToken: string;
  refreshToken: string;
  account: AuthAccountResponseDto;
};

export type RegisterResponseDto = { message: string };
export type RefreshTokenResponseDto = {
  accessToken: string;
  refreshToken?: string;
};
export type AuthMessageResponseDto = { message: string };
export type ResetPasswordResponseDto = { message: string };
export type LoginDto = { email: string; password: string };
export type RegisterDto = {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  nationality?: string;
  ethnicity?: string;
  occupation?: string;
};
export type ForgotPasswordDto = { email: string };
export type RefreshTokenDto = { refreshToken: string };
export type VerifyOtpDto = { email: string; otp: string };
export type ResetPasswordWithOtpDto = {
  email: string;
  otp: string;
  newPassword: string;
};
export type ResendVerificationDto = { email: string };
export type ResetPasswordWithTokenDto = { token: string; newPassword: string };

export type PatientUserSummary = {
  id?: string;
  fullName?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  status?: string;
};

export type PatientResponseDto = {
  id: string;
  userId: string;
  profileCode?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  createdAt: string;
  updatedAt: string;
  user?: PatientUserSummary;
};

export type PaginatedPatientResponseDto =
  PaginatedResponseDto<PatientResponseDto>;

export type PatientProfileResponseDto = {
  patient: PatientResponseDto;
  summary: {
    totalMedicalRecords: number;
    totalVitalSigns: number;
    totalPrescriptions: number;
    latestVitalSign: unknown;
  };
};

export type UpdatePatientDto = {
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceExpiry?: string;
};

export type PatientQueryDto = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  bloodType?: string;
};

export enum AppointmentStatusEnum {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED",
}
export enum AppointmentTypeEnum {
  VIDEO = "VIDEO",
  IN_CLINIC = "IN_CLINIC",
}
export enum AppointmentSubTypeEnum {
  INSTANT = "INSTANT",
  SCHEDULED = "SCHEDULED",
  RE_EXAM = "RE_EXAM",
}
export enum SourceTypeEnum {
  INTERNAL = "INTERNAL",
  EXTERNAL = "EXTERNAL",
}
export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export type DoctorResponseDto = {
  id: string;
  userId: string;
  fullName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: GenderEnum;
  avatarUrl?: string;
  status: string;
  title?: string;
  position?: string;
  specialty?: string;
  yearsOfExperience?: number;
  practiceStartYear?: number;
  licenseNumber?: string;
  bio?: string;
  workExperience?: string;
  education?: string;
  expertiseDescription?: string;
  awardsResearch?: string;
  defaultConsultationFee?: string | null;
  address?: string;
  ward?: string;
  province?: string;
  primaryHospitalId?: string | null;
  primaryHospital?: {
    id: string;
    name: string;
    hospitalCode: string;
    address: string;
    phone: string;
  } | null;
  averageRating: string;
  totalReviews: number;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentResponseDto = {
  id: string;
  appointmentNumber: string;
  patient: PatientResponseDto;
  doctor: DoctorResponseDto;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  status: AppointmentStatusEnum;
  appointmentType: AppointmentTypeEnum;
  subType: AppointmentSubTypeEnum;
  sourceType: SourceTypeEnum;
  feeAmount: string;
  paidAmount: string;
  chiefComplaint?: string;
  symptoms?: string[];
  patientNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedAppointmentResponseDto =
  PaginatedResponseDto<AppointmentResponseDto>;
export type AppointmentQueryDto = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  status?: AppointmentStatusEnum;
  appointmentType?: AppointmentTypeEnum;
  startDate?: string;
  endDate?: string;
};
export type PatientAppointmentQueryDto = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  status?: AppointmentStatusEnum;
  startDate?: string;
  endDate?: string;
};
export type CreateAppointmentDto = {
  timeSlotId: string;
  patientId?: string;
  hospitalId?: string;
  subType?: AppointmentSubTypeEnum;
  sourceType?: SourceTypeEnum;
  chiefComplaint?: string;
  symptoms?: string[];
  patientNotes?: string;
};
export type CancelAppointmentDto = { reason: string };
export type RescheduleAppointmentDto = { newTimeSlotId: string };
export type TimeSlotResponseDto = {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  isAvailable: boolean;
};
export type JoinVideoCallResponseDto = {
  token: string;
  roomName: string;
  roomUrl: string;
  expiresAt: string;
};

export enum NotificationTypeEnum {
  GENERAL = "GENERAL",
  PAYMENT = "PAYMENT",
  CONTRACT = "CONTRACT",
  PENALTY = "PENALTY",
  SYSTEM = "SYSTEM",
  APPOINTMENT = "APPOINTMENT",
}
export enum StatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
export type NotificationResponseDto = {
  id: string;
  userId: string;
  type: NotificationTypeEnum;
  title: string;
  content: string;
  status: StatusEnum;
  createdAt?: string;
};
export type PaginatedNotificationResponseDto =
  PaginatedResponseDto<NotificationResponseDto>;
export type NotificationUnreadCountResponseDto = { count: number };
export type NotificationMarkReadResponse = {
  success: boolean;
  message: string;
};

export type ReportType = "doctor" | "appointment" | "system";
export type ReportStatus = "pending" | "in_progress" | "resolved" | "rejected";
export type ReportResponseDto = {
  id: string;
  reporterId: string;
  doctorId?: string;
  appointmentId?: string;
  reportType: ReportType;
  content: string;
  status: ReportStatus;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
};
export type CreateReportDto = {
  doctorId?: string;
  appointmentId?: string;
  reportType?: ReportType;
  content: string;
};

export type ChatUserBasicDto = { id: string; fullName: string; email: string };
export type ChatRoomResponseDto = {
  id: string;
  user1: ChatUserBasicDto;
  user2: ChatUserBasicDto;
  createdAt: string;
  updatedAt: string;
};
export type SenderBasicDto = { id: string; fullName: string; email: string };
export type ChatMessageResponseDto = {
  id: string;
  chatroomId: string;
  sender: SenderBasicDto;
  content: string;
  createdAt: string;
};
export type CreateChatRoomDto = { user1Id: string; user2Id: string };
export type CreateChatMessageDto = { chatroomId: string; content: string };

export type VitalSignResponseDto = {
  id: string;
  patientId: string;
  medicalRecordId?: string;
  temperature?: number;
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  notes?: string;
  createdAt: string;
};

export type MedicalRecordResponseDto = {
  id: string;
  recordNumber: string;
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PrescriptionResponseDto = {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId?: string;
  medicalRecordId?: string;
  appointmentId?: string;
  diagnosis?: string;
  notes?: string;
  status: string;
  items: {
    id: string;
    medicineId?: string;
    medicineName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity?: number;
    instructions?: string;
    unit: string;
  }[];
  createdAt: string;
  pdfUrl?: string;
};

export enum SignedStatusEnum {
  NOT_SIGNED = "NOT_SIGNED",
  SIGNED = "SIGNED",
}

export type MedicalRecordDetailResponseDto = {
  id: string;
  recordNumber: string | null;
  patient: {
    id: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
  };
  doctor: {
    id: string;
    fullName: string;
  };
  appointment: {
    id: string;
    appointmentNumber: string;
    status: string;
    scheduledAt: string;
  };
  signedStatus: SignedStatusEnum;
  signedAt?: string;
  digitalSignature?: string;
  diagnosis?: string;
  recordType: string;
  chiefComplaint?: string;
  vitalSigns: {
    temperature?: number;
    respiratoryRate?: number;
    weight?: number;
    bloodPressure?: string;
    heartRate?: number;
    height?: number;
    bmi?: number;
    spo2?: number;
  };
  presentIllness?: string;
  medicalHistory?: string;
  familyHistory?: string;
  physicalExamNotes?: string;
  systemsReview?: string;
  treatmentGiven?: string;
  dischargeDiagnosis?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  prescriptions: {
    id: string;
    prescriptionNumber: string;
    items: {
      medicineName: string;
      quantity: number;
      unit: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
      startDate?: string;
      endDate?: string;
    }[];
    notes?: string;
    createdAt: string;
    pdfUrl?: string;
    instructions?: string;
  }[];
  progressNotes?: string;
  primaryDiagnosis?: string;
  secondaryDiagnosis?: string;
  treatmentPlan?: string;
  dischargeCondition?: string;
  followUpInstructions?: string;
  fullRecordSummary?: string;
  assessment?: string;
  surgicalHistory?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  currentMedications?: string[];
  smokingStatus?: boolean;
  smokingYears?: number;
  alcoholConsumption?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
};

export enum ScreeningPriorityEnum {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}
export enum ScreeningStatusEnum {
  UPLOADED = "UPLOADED",
  PENDING_AI = "PENDING_AI",
  AI_PROCESSING = "AI_PROCESSING",
  AI_COMPLETED = "AI_COMPLETED",
  AI_FAILED = "AI_FAILED",
  PENDING_DOCTOR = "PENDING_DOCTOR",
  DOCTOR_REVIEWING = "DOCTOR_REVIEWING",
  DOCTOR_COMPLETED = "DOCTOR_COMPLETED",
  CANCELLED = "CANCELLED",
}
export enum ScreeningTypeEnum {
  XRAY = "XRAY",
  CT = "CT",
  MRI = "MRI",
  ULTRASOUND = "ULTRASOUND",
  MAMMOGRAPHY = "MAMMOGRAPHY",
  PET_SCAN = "PET_SCAN",
}

export type MedicalImageResponseDto = {
  id: string;
  screeningId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};
export type AiAnalysisResponseDto = {
  id: string;
  screeningId: string;
  medicalImageId: string;
  diagnosisStatus: string;
  totalFindings: number;
  analyzedAt: string;
  createdAt: string;
};
export type ScreeningConclusionResponseDto = {
  id: string;
  patientId: string;
  doctorId?: string;
  reviewedAt: string;
  createdAt: string;
  updatedAt: string;
};
export type ScreeningRequestResponseDto = {
  id: string;
  patientId: string;
  screeningNumber: string;
  screeningType: ScreeningTypeEnum;
  status: ScreeningStatusEnum;
  priority: ScreeningPriorityEnum;
  createdAt: string;
  updatedAt: string;
  patient?: PatientResponseDto;
  uploadedByDoctor?: DoctorResponseDto;
  images?: MedicalImageResponseDto[];
  aiAnalyses?: AiAnalysisResponseDto[];
  conclusions?: ScreeningConclusionResponseDto[];
};
export type UploadAnalyzeResponseDto = {
  screening: ScreeningRequestResponseDto;
  image: MedicalImageResponseDto;
  analysis: AiAnalysisResponseDto;
};
export type GetScreeningRequestsDto = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
  status?: ScreeningStatusEnum;
  screeningType?: ScreeningTypeEnum;
  patientId?: string;
};
export type PaginatedScreeningRequestResponseDto =
  PaginatedResponseDto<ScreeningRequestResponseDto>;
export type CreateScreeningRequestDto = {
  patientId: string;
  screeningType?: ScreeningTypeEnum;
  source?: string;
  deviceInfo?: Record<string, unknown>;
};
