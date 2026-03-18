import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import favoriteService from "@/services/favorite.service";
import type { CreateFavoriteDto } from "@/types/favorite.types";

export const useFavorites = () => {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoriteService.getFavorites(),
  });
};

export const useCheckFavoriteDoctor = (doctorId: string) => {
  return useQuery({
    queryKey: ["favorites", "doctor", doctorId],
    queryFn: () => favoriteService.checkFavoriteDoctor(doctorId),
    enabled: !!doctorId,
  });
};

export const useCheckFavoriteHospital = (hospitalId: string) => {
  return useQuery({
    queryKey: ["favorites", "hospital", hospitalId],
    queryFn: () => favoriteService.checkFavoriteHospital(hospitalId),
    enabled: !!hospitalId,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFavoriteDto) => favoriteService.addFavorite(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      if (variables.doctorId) {
        queryClient.invalidateQueries({ queryKey: ["favorites", "doctor", variables.doctorId] });
      }
      if (variables.hospitalId) {
        queryClient.invalidateQueries({ queryKey: ["favorites", "hospital", variables.hospitalId] });
      }
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favoriteService.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};
