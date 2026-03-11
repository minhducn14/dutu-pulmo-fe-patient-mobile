import { api } from '@/services/api';
import type { CreateReportDto, ReportResponseDto } from '@/types/generated/patient-api';

export const reportService = {
  createReport: async (payload: CreateReportDto) => {
    const { data } = await api.post<ReportResponseDto>('/reports', payload);
    return data;
  },

  getMyReports: async () => {
    const { data } = await api.get<ReportResponseDto[]>('/reports/my-reports');
    return data;
  },

  getReportById: async (reportId: string) => {
    const { data } = await api.get<ReportResponseDto>(`/reports/${reportId}`);
    return data;
  },
};

export default reportService;
