import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { appointmentService } from '@/services/appointment.service';
import type { AppointmentTypeFilter } from '@/services/appointment.service';
import type {
  CancelAppointmentDto,
  CreateAppointmentDto,
  PatientAppointmentQueryDto,
  RescheduleAppointmentDto,
} from '@/types/appointment.types';

const appointmentKeys = {
  myList: (params?: PatientAppointmentQueryDto) => ['appointments', 'my-patient', params] as const,
  detail: (appointmentId: string) => ['appointments', 'detail', appointmentId] as const,
  doctors: (params?: Record<string, unknown>) => ['doctors', 'public', params] as const,
  doctorDetail: (doctorId: string) => ['doctors', 'detail', doctorId] as const,
  doctorSlots: (doctorId: string, date: string, appointmentType: AppointmentTypeFilter) =>
    ['doctors', 'slots', doctorId, date, appointmentType] as const,
  doctorSlotSummary: (
    doctorId: string,
    from: string,
    to: string,
    appointmentType: AppointmentTypeFilter,
  ) => ['doctors', 'slots', 'summary', doctorId, from, to, appointmentType] as const,
  videoStatus: (appointmentId: string) =>
    ['appointments', 'video-status', appointmentId] as const,
  specialties: () => ['doctors', 'specialties'] as const,
};

export function useAppointments(params?: PatientAppointmentQueryDto) {
  return useQuery({
    queryKey: appointmentKeys.myList(params),
    queryFn: () => appointmentService.getMyPatientAppointments(params),
  });
}

export function useAppointmentDetail(appointmentId: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => appointmentService.getAppointmentById(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useSpecialties() {
  return useQuery({
    queryKey: appointmentKeys.specialties(),
    queryFn: () => appointmentService.getSpecialties(),
  });
}

export function usePublicDoctors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  specialty?: string;
  hospitalId?: string;
  appointmentType?: AppointmentTypeFilter;
}) {
  return useQuery({
    queryKey: appointmentKeys.doctors(params),
    queryFn: () => appointmentService.getPublicDoctors(params),
  });
}

export function usePublicDoctorDetail(doctorId: string) {
  return useQuery({
    queryKey: appointmentKeys.doctorDetail(doctorId),
    queryFn: () => appointmentService.getPublicDoctorById(doctorId),
    enabled: Boolean(doctorId),
  });
}

export function useDoctorAvailableSlots(
  doctorId: string,
  date: string,
  appointmentType: AppointmentTypeFilter = 'all',
) {
  return useQuery({
    queryKey: appointmentKeys.doctorSlots(doctorId, date, appointmentType),
    queryFn: () =>
      appointmentService.getDoctorAvailableTimeSlots(
        doctorId,
        date,
        appointmentType,
      ),
    enabled: Boolean(doctorId && date),
  });
}

export function useDoctorTimeSlotSummary(
  doctorId: string,
  from: string,
  to: string,
  appointmentType: AppointmentTypeFilter = 'all',
) {
  return useQuery({
    queryKey: appointmentKeys.doctorSlotSummary(
      doctorId,
      from,
      to,
      appointmentType,
    ),
    queryFn: () =>
      appointmentService.getDoctorTimeSlotSummary(doctorId, {
        from,
        to,
        appointmentType,
      }),
    enabled: Boolean(doctorId && from && to),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentDto) => appointmentService.createAppointment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: CancelAppointmentDto }) =>
      appointmentService.cancelAppointment(appointmentId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.appointmentId) });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: RescheduleAppointmentDto }) =>
      appointmentService.rescheduleAppointment(appointmentId, payload),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.appointmentId) });
    },
  });
}

export function useJoinVideoCall() {
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentService.joinVideoCall(appointmentId),
  });
}

export function useLeaveVideoCall() {
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentService.leaveVideoCall(appointmentId),
  });
}

export function useVideoCallStatus(appointmentId: string) {
  return useQuery({
    queryKey: appointmentKeys.videoStatus(appointmentId),
    queryFn: () => appointmentService.getVideoCallStatus(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useCheckInVideoCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) => appointmentService.checkInAppointment(appointmentId),
    onSuccess: (_, appointmentId) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(appointmentId) });
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function usePendingPaymentAppointments() {
  return useQuery({
    queryKey: appointmentKeys.myList({
      status: 'PENDING_PAYMENT' as any,
      limit: 5,
      sort: 'createdAt',
      order: 'DESC',
    }),
    queryFn: () =>
      appointmentService.getMyPatientAppointments({
        status: 'PENDING_PAYMENT' as any,
        limit: 5,
        sort: 'createdAt',
        order: 'DESC',
      }),
  });
}
