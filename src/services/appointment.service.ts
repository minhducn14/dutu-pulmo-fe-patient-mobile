import { api } from '@/services/api';
import { cleanParams } from '@/utils/query';
import type {
  AppointmentQueryDto,
  AppointmentResponseDto,
  JoinVideoCallResponseDto,
  CreateAppointmentDto,
  CancelAppointmentDto,
  DoctorResponseDto,
  PaginatedAppointmentResponseDto,
  PaginatedResponseDto,
  PatientAppointmentQueryDto,
  RescheduleAppointmentDto,
  TimeSlotResponseDto,
} from '@/types/appointment.types';

export const appointmentService = {
  getSpecialties: async () => {
    const { data } = await api.get<string[]>('/public/doctors/specialties');
    return data;
  },

  getPublicDoctors: async (query?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
    specialty?: string;
    hospitalId?: string;
  }) => {
    const { data } = await api.get<PaginatedResponseDto<DoctorResponseDto>>(
      '/public/doctors',
      {
        params: cleanParams(query),
      },
    );
    return data;
  },

  getPublicDoctorById: async (doctorId: string) => {
    const { data } = await api.get<DoctorResponseDto>(
      `/public/doctors/${doctorId}`,
    );
    return data;
  },

  getDoctorTimeSlots: async (doctorId: string) => {
    const { data } = await api.get<TimeSlotResponseDto[]>(
      `/public/doctors/${doctorId}/time-slots`,
    );
    return data;
  },

  getDoctorAvailableTimeSlots: async (doctorId: string, date: string) => {
    const { data } = await api.get<TimeSlotResponseDto[]>(
      `/public/doctors/${doctorId}/time-slots/available`,
      {
        params: { date },
      },
    );
    return data;
  },

  getDoctorTimeSlotSummary: async (
    doctorId: string,
    params?: { from?: string; to?: string },
  ) => {
    const { data } = await api.get<
      { date: string; count: number; hasAvailability: boolean }[]
    >(`/public/doctors/${doctorId}/time-slots/summary`, {
      params: cleanParams(params),
    });
    return data;
  },

  createAppointment: async (payload: CreateAppointmentDto) => {
    const { data } = await api.post<AppointmentResponseDto>(
      '/appointments',
      payload,
    );
    return data;
  },

  getAppointments: async (query?: AppointmentQueryDto) => {
    const { data } = await api.get<PaginatedAppointmentResponseDto>(
      '/appointments',
      {
        params: cleanParams(query),
      },
    );
    return data;
  },

  getMyPatientAppointments: async (query?: PatientAppointmentQueryDto) => {
    const { data } = await api.get<PaginatedAppointmentResponseDto>(
      '/appointments/my/patient',
      {
        params: cleanParams(query),
      },
    );
    return data;
  },

  getAppointmentById: async (appointmentId: string) => {
    const { data } = await api.get<AppointmentResponseDto>(
      `/appointments/${appointmentId}`,
    );
    return data;
  },

  cancelAppointment: async (
    appointmentId: string,
    payload: CancelAppointmentDto,
  ) => {
    const { data } = await api.put<AppointmentResponseDto>(
      `/appointments/${appointmentId}/cancel`,
      payload,
    );
    return data;
  },

  rescheduleAppointment: async (
    appointmentId: string,
    payload: RescheduleAppointmentDto,
  ) => {
    const { data } = await api.put<AppointmentResponseDto>(
      `/appointments/${appointmentId}/reschedule`,
      payload,
    );
    return data;
  },

  checkInVideo: async (appointmentId: string) => {
    const { data } = await api.post<AppointmentResponseDto>(
      `/appointments/${appointmentId}/check-in/video`,
    );
    return data;
  },

  joinVideoCall: async (appointmentId: string) => {
    const { data } = await api.post<JoinVideoCallResponseDto>(
      `/appointments/${appointmentId}/video/join`,
    );
    return data;
  },

  leaveVideoCall: async (appointmentId: string) => {
    const { data } = await api.post<{ message: string }>(
      `/appointments/${appointmentId}/video/leave`,
    );
    return data;
  },
};

export default appointmentService;
