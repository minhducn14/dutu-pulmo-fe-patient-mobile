import { api } from "@/services/api";
import type { ReviewResponseDto, CreateReviewDto, UpdateReviewDto } from "@/types/review.types";

export const reviewService = {
  getReviewsByDoctor: async (doctorId: string) => {
    const { data } = await api.get<ReviewResponseDto[]>(`/reviews/doctor/${doctorId}`);
    return data;
  },

  getMyReviews: async () => {
    const { data } = await api.get<ReviewResponseDto[]>("/reviews/my-reviews");
    return data;
  },

  getReviewById: async (id: string) => {
    const { data } = await api.get<ReviewResponseDto>(`/reviews/${id}`);
    return data;
  },

  createReview: async (payload: CreateReviewDto) => {
    const { data } = await api.post<ReviewResponseDto>("/reviews", payload);
    return data;
  },

  updateReview: async (id: string, payload: UpdateReviewDto) => {
    const { data } = await api.patch<ReviewResponseDto>(`/reviews/${id}`, payload);
    return data;
  },

  deleteReview: async (id: string) => {
    const { data } = await api.delete(`/reviews/${id}`);
    return data;
  },
};

export default reviewService;
