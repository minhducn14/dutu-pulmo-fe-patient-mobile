import { api } from "@/services/api";
import type { FavoriteResponseDto, CreateFavoriteDto } from "@/types/favorite.types";

export const favoriteService = {
  getFavorites: async () => {
    const { data } = await api.get<FavoriteResponseDto[]>("/favorites");
    return data;
  },

  checkFavoriteDoctor: async (doctorId: string) => {
    const { data } = await api.get<FavoriteResponseDto | null>(`/favorites/doctor/${doctorId}`);
    return data;
  },

  checkFavoriteHospital: async (hospitalId: string) => {
    const { data } = await api.get<FavoriteResponseDto | null>(`/favorites/hospital/${hospitalId}`);
    return data;
  },

  addFavorite: async (payload: CreateFavoriteDto) => {
    const { data } = await api.post<FavoriteResponseDto>("/favorites", payload);
    return data;
  },

  removeFavorite: async (id: string) => {
    const { data } = await api.delete(`/favorites/${id}`);
    return data;
  },
};

export default favoriteService;
