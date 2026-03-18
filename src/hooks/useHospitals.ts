import { useQuery } from '@tanstack/react-query';
import { hospitalService } from '@/services/hospital.service';
import type { HospitalQueryDto } from '@/types/hospital.types';

export const hospitalKeys = {
  all: ['hospitals'] as const,
  lists: () => [...hospitalKeys.all, 'list'] as const,
  list: (params?: HospitalQueryDto) =>
    [...hospitalKeys.lists(), params] as const,
  details: () => [...hospitalKeys.all, 'detail'] as const,
  detail: (id: string) => [...hospitalKeys.details(), id] as const,
  doctors: (id: string, page?: number, limit?: number) =>
    [...hospitalKeys.detail(id), 'doctors', { page, limit }] as const,
  cities: () => [...hospitalKeys.all, 'cities'] as const,
};

export function useHospitals(params?: HospitalQueryDto) {
  return useQuery({
    queryKey: hospitalKeys.list(params),
    queryFn: () => hospitalService.getHospitals(params),
  });
}

export function useHospitalDetail(id: string) {
  return useQuery({
    queryKey: hospitalKeys.detail(id),
    queryFn: () => hospitalService.getHospitalById(id),
    enabled: Boolean(id),
  });
}

export function useHospitalDoctors(id: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: hospitalKeys.doctors(id, page, limit),
    queryFn: () => hospitalService.getHospitalDoctors(id, page, limit),
    enabled: Boolean(id),
  });
}

export function useHospitalCities() {
  return useQuery({
    queryKey: hospitalKeys.cities(),
    queryFn: () => hospitalService.getCities(),
  });
}
