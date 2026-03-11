import { api } from '@/services/api';
import { cleanParams } from '@/utils/query';
import type {
  CreateScreeningRequestDto,
  GetScreeningRequestsDto,
  PaginatedScreeningRequestResponseDto,
  ScreeningConclusionResponseDto,
  ScreeningRequestResponseDto,
  UploadAnalyzeResponseDto,
  MedicalImageResponseDto,
  AiAnalysisResponseDto,
} from '@/types/screening.types';

export const screeningService = {
  getScreenings: async (query?: GetScreeningRequestsDto) => {
    const { data } = await api.get<PaginatedScreeningRequestResponseDto>('/screenings', {
      params: cleanParams(query),
    });
    return data;
  },

  getUploadedScreenings: async (query?: GetScreeningRequestsDto) => {
    const { data } = await api.get<PaginatedScreeningRequestResponseDto>('/screenings/uploaded', {
      params: cleanParams(query),
    });
    return data;
  },

  getScreeningById: async (screeningId: string) => {
    const { data } = await api.get<ScreeningRequestResponseDto>(`/screenings/${screeningId}`);
    return data;
  },

  createScreeningRequest: async (payload: CreateScreeningRequestDto) => {
    const { data } = await api.post<ScreeningRequestResponseDto>('/screenings', payload);
    return data;
  },

  uploadAndAnalyzeImage: async (screeningId: string, payload: FormData) => {
    const { data } = await api.post<UploadAnalyzeResponseDto>(`/screenings/${screeningId}/images/upload`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  triggerImageAnalyze: async (screeningId: string, imageId: string) => {
    const { data } = await api.post<AiAnalysisResponseDto>(`/screenings/${screeningId}/images/${imageId}/analyze`);
    return data;
  },

  getScreeningImages: async (screeningId: string) => {
    const { data } = await api.get<MedicalImageResponseDto[]>(`/screenings/${screeningId}/images`);
    return data;
  },

  getScreeningAnalyses: async (screeningId: string) => {
    const { data } = await api.get<AiAnalysisResponseDto[]>(`/screenings/${screeningId}/analyses`);
    return data;
  },

  getAnalysisDetail: async (analysisId: string) => {
    const { data } = await api.get<AiAnalysisResponseDto>(`/screenings/analyses/${analysisId}`);
    return data;
  },

  getScreeningConclusions: async (screeningId: string) => {
    const { data } = await api.get<ScreeningConclusionResponseDto[]>(`/screenings/${screeningId}/conclusions`);
    return data;
  },
};

export default screeningService;
