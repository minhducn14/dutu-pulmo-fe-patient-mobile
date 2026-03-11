import { api } from '@/services/api';
import type {
  MedicalRecordDetailResponseDto,
  MedicalRecordResponseDto,
  PrescriptionResponseDto,
} from '@/types/generated/patient-api';

export const medicalService = {
  getMedicalRecordDetail: async (recordId: string) => {
    const { data } = await api.get<MedicalRecordDetailResponseDto>(`/medical/records/${recordId}/detail`);
    return data;
  },

  getMedicalRecordPdf: async (recordId: string) => {
    const { data } = await api.get<{ pdfUrl?: string; url?: string }>(`/medical/records/${recordId}/pdf`);
    return data;
  },

  getPrescriptionDetail: async (prescriptionId: string) => {
    const { data } = await api.get<PrescriptionResponseDto>(`/medical/prescriptions/${prescriptionId}`);
    return data;
  },

  getPrescriptionPdf: async (prescriptionId: string) => {
    const { data } = await api.get<{ pdfUrl?: string; url?: string }>(`/medical/prescriptions/${prescriptionId}/pdf`);
    return data;
  },

  getPatientPrescriptionsFromMedical: async (patientId: string) => {
    const { data } = await api.get<PrescriptionResponseDto[]>(`/medical/prescriptions/patient/${patientId}`);
    return data;
  },

  getPatientRecordsFromPatientRoute: async (patientId: string) => {
    const { data } = await api.get<MedicalRecordResponseDto[]>(`/patients/${patientId}/medical-records`);
    return data;
  },
};

export default medicalService;
