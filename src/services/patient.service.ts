import { api } from '@/services/api';
import { cleanParams } from '@/utils/query';
import type {
  MedicalRecordResponseDto,
  PaginatedPatientResponseDto,
  PatientProfileResponseDto,
  PatientQueryDto,
  PatientResponseDto,
  PrescriptionResponseDto,
  UpdatePatientDto,
  VitalSignResponseDto,
} from '@/types/patient.types';
import type {
  AppointmentResponseDto,
  PaginatedAppointmentResponseDto,
  PatientAppointmentQueryDto,
} from '@/types/appointment.types';

export const patientService = {
  getPatients: async (query?: PatientQueryDto) => {
    const { data } = await api.get<PaginatedPatientResponseDto>('/patients', {
      params: cleanParams(query),
    });
    return data;
  },

  getMyPatient: async () => {
    const { data } = await api.get<PatientResponseDto>('/patients/me');
    return data;
  },

  getMyProfile: async () => {
    const { data } = await api.get<PatientProfileResponseDto>('/patients/me/profile');
    return data;
  },

  getPatientById: async (patientId: string) => {
    const { data } = await api.get<PatientResponseDto>(`/patients/${patientId}`);
    return data;
  },

  updatePatient: async (patientId: string, payload: UpdatePatientDto) => {
    const { data } = await api.patch<PatientResponseDto>(`/patients/${patientId}`, payload);
    return data;
  },

  getPatientMedicalRecords: async (patientId: string) => {
    const { data } = await api.get<MedicalRecordResponseDto[]>(`/patients/${patientId}/medical-records`);
    return data;
  },

  getPatientVitalSigns: async (patientId: string) => {
    const { data } = await api.get<VitalSignResponseDto[]>(`/patients/${patientId}/vital-signs`);
    return data;
  },

  getPatientPrescriptions: async (patientId: string) => {
    const { data } = await api.get<PrescriptionResponseDto[]>(`/patients/${patientId}/prescriptions`);
    return data;
  },

  getPatientAppointments: async (patientId: string, query?: PatientAppointmentQueryDto) => {
    const { data } = await api.get<PaginatedAppointmentResponseDto>(`/patients/${patientId}/appointments`, {
      params: cleanParams(query),
    });
    return data;
  },

  getPatientProfileById: async (patientId: string) => {
    const { data } = await api.get<PatientProfileResponseDto>(`/patients/${patientId}/profile`);
    return data;
  },

  getMyAppointments: async (query?: PatientAppointmentQueryDto) => {
    const { data } = await api.get<PaginatedAppointmentResponseDto>('/appointments/my/patient', {
      params: cleanParams(query),
    });
    return data;
  },

  getAppointmentDetail: async (appointmentId: string) => {
    const { data } = await api.get<AppointmentResponseDto>(`/appointments/${appointmentId}`);
    return data;
  },
};

export default patientService;
